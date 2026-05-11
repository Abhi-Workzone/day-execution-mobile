import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { planApi, taskApi } from '../api';
import { Ionicons } from '@expo/vector-icons';
import { format, addDays, startOfDay } from 'date-fns';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Loading from '../components/Loading';
import DateTimePicker from '@react-native-community/datetimepicker';
import { showToast } from '../utils/toast';

const PlanScreen = () => {
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState({ routines: [], tasks: [] });
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [alreadyPlanned, setAlreadyPlanned] = useState(false);
  const [schedulingTask, setSchedulingTask] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [customDates, setCustomDates] = useState([]);
  const [calendarMode, setCalendarMode] = useState(false);
  const [originalSelectedDate, setOriginalSelectedDate] = useState(new Date());
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [selectedStartTime, setSelectedStartTime] = useState('');
  const [selectedEndTime, setSelectedEndTime] = useState('');

  // Generate time options for pickers
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(time);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  const getFilteredStartTimeOptions = () => {
    if (selectedEndTime) {
      // Show times before end time
      return timeOptions.filter(time => time < selectedEndTime);
    }
    return timeOptions;
  };

  const getFilteredEndTimeOptions = () => {
    if (selectedStartTime) {
      // Show times after start time
      return timeOptions.filter(time => time > selectedStartTime);
    }
    return timeOptions;
  };

  const handleStartTimeSelect = (time) => {
    setSelectedStartTime(time);
    setSchedulingTask({ ...schedulingTask, plannedStart: time });
    
    // Auto-calculate end time if not set or if it conflicts
    if (!selectedEndTime || time >= selectedEndTime) {
      if (schedulingTask?.estimatedTime) {
        const [hours, minutes] = time.split(':').map(Number);
        const endTime = new Date();
        endTime.setHours(hours, minutes + schedulingTask.estimatedTime, 0);
        const endTimeStr = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
        setSelectedEndTime(endTimeStr);
        setSchedulingTask({ ...schedulingTask, plannedStart: time, plannedEnd: endTimeStr });
      }
    }
    setShowStartTimePicker(false);
  };

  const handleEndTimeSelect = (time) => {
    setSelectedEndTime(time);
    setSchedulingTask({ ...schedulingTask, plannedEnd: time });
    setShowEndTimePicker(false);
  };

  const openStartTimePicker = () => {
    setShowStartTimePicker(true);
    setShowEndTimePicker(false);
  };

  const openEndTimePicker = () => {
    setShowEndTimePicker(true);
    setShowStartTimePicker(false);
  };

  const openScheduleModal = (task) => {
    setSchedulingTask({
      ...task,
      plannedStart: '23:00',
      plannedEnd: calculateEndTime('23:00', task.estimatedTime || 30)
    });
    setSelectedStartTime('23:00');
    setSelectedEndTime(calculateEndTime('23:00', task.estimatedTime || 30));
    setShowModal(true);
  };

  // Store the original selected date when component mounts
  useEffect(() => {
    setOriginalSelectedDate(selectedDate);
  }, []);

  // Generate 5 consecutive dates starting from today
  const generateDateOptions = () => {
    const dates = [];
    const today = startOfDay(new Date());
    
    for (let i = 0; i < 5; i++) {
      dates.push(addDays(today, i));
    }
    
    return dates;
  };

  const defaultDateOptions = generateDateOptions();
  const dateOptions = customDates.length > 0 ? customDates : defaultDateOptions;

  const isDateSelected = (date) => {
    return format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
  };

  const selectDate = (date) => {
    setSelectedDate(date);
  };

  const handleCalendarPress = () => {
    setCalendarMode(true);
    setShowCalendar(true);
  };

  const handleDateSelect = (date) => {
    const newDate = startOfDay(date);
    
    if (calendarMode) {
      // Replace the last date in the row with the selected date
      const updatedDates = [...dateOptions.slice(0, 4), newDate];
      setCustomDates(updatedDates);
      
      // Select the new date
      setSelectedDate(newDate);
      
      // Close calendar
      setShowCalendar(false);
      setCalendarMode(false);
    }
  };

  const handleResetDates = () => {
    setCustomDates([]);
    setCalendarMode(false);
    // Reset to the originally selected date
    setSelectedDate(originalSelectedDate);
  };

  const getCurrentDateOptions = () => {
    if (customDates.length > 0) {
      return customDates;
    }
    return dateOptions;
  };

  useFocusEffect(
    useCallback(() => {
      fetchContext();
    }, [selectedDate])
  );

  const fetchContext = async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await planApi.getTodayPlan(dateStr);
      const suggs = response.data.suggestions || { routines: [], tasks: [] };
      setSuggestions(suggs);

      if (response.data.exists) {
        setAlreadyPlanned(true);
        const existingTasks = response.data.plan.tasks.map(t => ({
          id: t.taskId || t._id,
          title: t.title,
          type: t.type,
          plannedStart: t.plannedStart,
          plannedEnd: t.plannedEnd,
          duration: t.plannedDuration || 0,
          status: t.status || 'pending',
          actualTime: t.actualTime || 0,
          reason: t.reason || ''
        }));
        setSelectedTasks(existingTasks);
      } else {
        setAlreadyPlanned(false);
        const initialRoutines = suggs.routines.map(r => ({
          id: r._id,
          title: r.title,
          type: 'routine',
          plannedStart: r.startTime,
          plannedEnd: calculateEndTime(r.startTime, r.duration),
          duration: r.duration
        }));
        setSelectedTasks(initialRoutines);
      }
    } catch (error) {
      console.error('Error fetching context:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateEndTime = (startTime, duration) => {
    if (!startTime) return '';
    const [hours, minutes] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes + (duration || 0), 0);
    return format(date, 'HH:mm');
  };

  const toggleTask = (task, type) => {
    const taskId = task._id;
    const exists = selectedTasks.find(t => t.id === taskId);

    if (exists) {
      setSelectedTasks(selectedTasks.filter(t => t.id !== taskId));
    } else {
      if (type === 'routine') {
        const startTime = task.startTime;
        const duration = task.duration || 0;
        const endTime = calculateEndTime(startTime, duration);
        setSelectedTasks([...selectedTasks, {
          id: taskId,
          title: task.title,
          type: type,
          plannedStart: startTime,
          plannedEnd: endTime,
          duration: duration
        }]);
      } else {
        openScheduleModal(task);
      }
    }
  };

  const confirmSchedule = () => {
    if (!schedulingTask) return;

    const duration = getGapInMinutes(schedulingTask.plannedStart, schedulingTask.plannedEnd);

    setSelectedTasks([...selectedTasks, {
      id: schedulingTask._id,
      title: schedulingTask.title,
      type: 'todo',
      plannedStart: schedulingTask.plannedStart,
      plannedEnd: schedulingTask.plannedEnd,
      duration: Math.max(0, duration)
    }]);

    setSchedulingTask(null);
    setShowModal(false);
  };

  const getGapInMinutes = (start, end) => {
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    return (h2 * 60 + m2) - (h1 * 60 + m1);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const tasksToSave = selectedTasks.map(t => ({
        taskId: t.id,
        title: t.title,
        type: t.type,
        plannedStart: t.plannedStart,
        plannedEnd: t.plannedEnd,
        plannedDuration: t.duration,
        status: t.status || 'pending',
        actualTime: t.actualTime || 0,
        reason: t.reason || ''
      }));

      const plannedTotalTime = selectedTasks.reduce((acc, t) => acc + (t.duration || 0), 0);

      await planApi.savePlan({
        date: selectedDate,
        tasks: tasksToSave,
        plannedTotalTime
      });

      showToast.success('Success', 'Plan saved successfully! 🚀');
    } catch (error) {
      console.error('Error saving plan:', error);
      showToast.error('Error', 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <View style={styles.container}>
      <Header title="Plan Your Day" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <View style={styles.header}>
          <View style={styles.dateSelector}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateScrollContainer}
            >
              {getCurrentDateOptions().map((date, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dateCard,
                    isDateSelected(date) && styles.dateCardSelected,
                    index === 4 && customDates.length > 0 && styles.customDateCard
                  ]}
                  onPress={() => selectDate(date)}
                >
                  <Text style={[
                    styles.dateDay,
                    isDateSelected(date) && styles.dateDaySelected
                  ]}>
                    {format(date, 'EEE')}
                  </Text>
                  <Text style={[
                    styles.dateNumber,
                    isDateSelected(date) && styles.dateNumberSelected
                  ]}>
                    {format(date, 'd')}
                  </Text>
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity
                style={[
                  styles.calendarButton,
                  customDates.length > 0 && styles.calendarButtonActive
                ]}
                onPress={customDates.length > 0 ? handleResetDates : handleCalendarPress}
              >
                <Ionicons 
                  name={customDates.length > 0 ? "refresh" : "calendar"} 
                  size={20} 
                  color={customDates.length > 0 ? "#FFFFFF" : "#3B82F6"} 
                />
              </TouchableOpacity>
            </ScrollView>
          </View>
          {alreadyPlanned && (
            <View style={styles.planIndicator}>
              <Text style={styles.planIndicatorText}>Plan active for this date</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suggested Routines</Text>
            {suggestions.routines.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="list-outline" size={40} color="#9CA3AF" />
                <Text style={styles.emptyText}>No routines found in your pool.</Text>
              </View>
            )}
            {suggestions.routines.map(r => {
              const isSelected = selectedTasks.find(t => t.id === r._id);
              return (
                <Card key={r._id} style={styles.taskCard}>
                  <TouchableOpacity onPress={() => toggleTask(r, 'routine')}>
                    <View style={styles.taskContent}>
                      <View style={styles.taskInfo}>
                        <View style={[styles.timeBadge, isSelected ? styles.timeBadgeSelected : null]}>
                          <Text style={[styles.timeText, isSelected ? styles.timeTextSelected : null]}>
                            {r.startTime}
                          </Text>
                        </View>
                        <View style={styles.taskDetails}>
                          <Text style={styles.taskTitle}>{r.title}</Text>
                          <Text style={styles.taskDuration}>{r.duration} mins</Text>
                        </View>
                      </View>
                      <Text style={[styles.checkIcon, isSelected ? styles.checkIconSelected : null]}>
                        {isSelected ? '✓' : '+'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Card>
              );
            })}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Todo Pool</Text>
            {suggestions.tasks.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="folder-outline" size={40} color="#9CA3AF" />
                <Text style={styles.emptyText}>No todo found in your pool.</Text>
              </View>
            )}
            {suggestions.tasks.map(t => {
              const isSelected = selectedTasks.find(t_item => t_item.id === t._id);
              const selectedItem = selectedTasks.find(t_item => t_item.id === t._id);
              return (
                <Card key={t._id} style={styles.taskCard}>
                  <TouchableOpacity onPress={() => toggleTask(t, 'todo')}>
                    <View style={styles.taskContent}>
                      <View style={styles.taskInfo}>
                        <View style={[styles.timeBadge, isSelected ? styles.timeBadgeSelected : null]}>
                          <Text style={[styles.timeText, isSelected ? styles.timeTextSelected : null]}>
                            {isSelected ? selectedItem.plannedStart : '+'}
                          </Text>
                        </View>
                        <View style={styles.taskDetails}>
                          <Text style={styles.taskTitle}>{t.title}</Text>
                          <Text style={styles.taskDuration}>{t.estimatedTime} mins</Text>
                        </View>
                      </View>
                      <Text style={[styles.checkIcon, isSelected ? styles.checkIconSelected : null]}>
                        {isSelected ? '✓' : '+'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Card>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {selectedTasks.length > 0 && (
        <View style={styles.bottomBar}>
          <View style={styles.bottomBarContent}>
            <Text style={styles.bottomBarTitle}>{selectedTasks.length} items scheduled</Text>
            <Button
              title={alreadyPlanned ? 'Update Plan' : 'Finalize & Execute'}
              onPress={handleSave}
              loading={saving === true}
              style={styles.saveButton}
            />
          </View>
        </View>
      )}

      {showCalendar && (
        <Modal animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.calendarModalContent}>
              <View style={styles.calendarHeader}>
                <Text style={styles.calendarTitle}>Select Date</Text>
                <TouchableOpacity onPress={() => setShowCalendar(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={new Date()}
                mode="date"
                display="spinner"
                onChange={(event, selectedDate) => handleDateSelect(selectedDate)}
                style={styles.datePicker}
              />
            </View>
          </View>
        </Modal>
      )}

      <Modal visible={showModal === true} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Schedule Task</Text>
            <Text style={styles.modalSubtitle}>{schedulingTask?.title}</Text>

            <View style={styles.timeInputsContainer}>
              <View style={styles.timeInputSection}>
                <Text style={styles.timeInputLabel}>Start Time</Text>
                <TouchableOpacity
                  style={styles.timeInputButton}
                  onPress={openStartTimePicker}
                >
                  <Text style={[
                    styles.timeInputText,
                    !selectedStartTime && styles.timeInputPlaceholder
                  ]}>
                    {selectedStartTime ? selectedStartTime : 'Select start time'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.timeInputSection}>
                <Text style={styles.timeInputLabel}>End Time</Text>
                <TouchableOpacity
                  style={styles.timeInputButton}
                  onPress={openEndTimePicker}
                >
                  <Text style={[
                    styles.timeInputText,
                    !selectedEndTime && styles.timeInputPlaceholder
                  ]}>
                    {selectedEndTime ? selectedEndTime : 'Select end time'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            {showStartTimePicker && (
              <View style={styles.timePickerContainer}>
                <Text style={styles.pickerTitle}>Select Start Time</Text>
                <ScrollView 
                  style={styles.pickerScroll}
                  showsVerticalScrollIndicator={false}
                >
                  {getFilteredStartTimeOptions().map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeOption,
                        selectedStartTime === time && styles.timeOptionSelected
                      ]}
                      onPress={() => handleStartTimeSelect(time)}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        selectedStartTime === time && styles.timeOptionTextSelected
                      ]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {showEndTimePicker && (
              <View style={styles.timePickerContainer}>
                <Text style={styles.pickerTitle}>Select End Time</Text>
                <ScrollView 
                  style={styles.pickerScroll}
                  showsVerticalScrollIndicator={false}
                >
                  {getFilteredEndTimeOptions().map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeOption,
                        selectedEndTime === time && styles.timeOptionSelected
                      ]}
                      onPress={() => handleEndTimeSelect(time)}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        selectedEndTime === time && styles.timeOptionTextSelected
                      ]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {selectedStartTime && selectedEndTime && (
              <View style={styles.durationDisplay}>
                <Text style={styles.durationText}>
                  Duration: {getGapInMinutes(selectedStartTime, selectedEndTime)} mins
                </Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setShowModal(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Confirm"
                onPress={confirmSchedule}
                style={styles.modalButton}
                disabled={!selectedStartTime || !selectedEndTime}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dateSelector: {
    marginBottom: 12,
  },
  dateScrollContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  datePicker: {
    marginBottom: 20,
  },
  dateCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 50,
  },
  dateCardSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  dateDay: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  dateDaySelected: {
    color: '#FFFFFF',
  },
  dateNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  dateNumberSelected: {
    color: '#FFFFFF',
  },
  calendarButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  calendarButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  customDateCard: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  calendarModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  planIndicator: {
    marginTop: 12,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  planIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
  },
  content: {
    padding: 16,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  taskCard: {
    marginBottom: 8,
  },
  taskContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timeBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  timeBadgeSelected: {
    backgroundColor: '#3B82F6',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  timeTextSelected: {
    color: '#FFFFFF',
  },
  taskDetails: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  taskDuration: {
    fontSize: 12,
    color: '#6B7280',
  },
  checkIcon: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D1D5DB',
  },
  checkIconSelected: {
    color: '#3B82F6',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 16,
  },
  bottomBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomBarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  saveButton: {
    minWidth: 120,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  timeInputsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  timeInputSection: {
    flex: 1,
  },
  timeInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  timeInputButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  timeInputText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  timeInputPlaceholder: {
    color: '#9CA3AF',
  },
  timePickerContainer: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  pickerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  pickerScroll: {
    maxHeight: 150,
  },
  timeOption: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
    alignItems: 'center',
  },
  timeOptionSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  timeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  timeOptionTextSelected: {
    color: '#FFFFFF',
  },
  durationDisplay: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 10
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
  },
});

export default PlanScreen;
