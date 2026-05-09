import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal, Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { planApi, summaryApi } from '../api';
import { format, addDays, startOfDay } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Loading from '../components/Loading';
import DateTimePicker from '@react-native-community/datetimepicker';

const ExecutionScreen = () => {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState(null);
  const [reason, setReason] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Animation states
  const scrollY = useRef(new Animated.Value(0)).current;
  const fabAnim = useRef(new Animated.Value(0)).current; // 0 is visible, 100 is hidden
  const lastScrollY = useRef(0);

  useFocusEffect(
    useCallback(() => {
      fetchPlan();
    }, [currentDate])
  );

  const handleScroll = (event) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const diff = currentScrollY - lastScrollY.current;

    if (diff > 10 && currentScrollY > 50) {
      // Scrolling down - Hide FAB
      Animated.spring(fabAnim, {
        toValue: 100,
        useNativeDriver: true,
        tension: 50,
        friction: 8
      }).start();
    } else if (diff < -10) {
      // Scrolling up - Show FAB
      Animated.spring(fabAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8
      }).start();
    }
    lastScrollY.current = currentScrollY;
  };

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const dateStr = currentDate.toISOString().split('T')[0];
      const response = await planApi.getTodayPlan(dateStr);
      if (response.data.exists) {
        const sortedTasks = response.data.plan.tasks.sort((a, b) => {
          const timeA = a.plannedStart || '00:00';
          const timeB = b.plannedStart || '00:00';
          return timeA.localeCompare(timeB);
        });
        setPlan({ ...response.data.plan, tasks: sortedTasks });
      } else {
        const routines = response.data.suggestions.routines.map(r => ({
          _id: r._id,
          title: r.title,
          type: 'routine',
          plannedStart: r.startTime,
          plannedEnd: r.startTime,
          status: 'pending'
        }));
        const sortedRoutines = routines.sort((a, b) => a.plannedStart.localeCompare(b.plannedStart));
        setPlan({ tasks: sortedRoutines, isFallback: true });
      }
    } catch (error) {
      console.error('Error fetching plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateDate = (days) => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + days);
    setCurrentDate(nextDate);
  };

  const handleDateChange = (event, selectedDate) => {
    if (selectedDate) {
      setCurrentDate(startOfDay(selectedDate));
    }
  };

  const updateStatus = async (taskId, status) => {
    const currentTask = plan?.tasks?.find(t => t._id === taskId);
    if (!currentTask) return;

    if (currentTask.status === status) {
      performStatusUpdate(taskId, 'pending', '');
      return;
    }

    if (status === 'missed' || status === 'partial') {
      setPendingStatusUpdate({ id: taskId, status });
      setShowReasonModal(true);
      return;
    }

    performStatusUpdate(taskId, status, '');
  };

  const performStatusUpdate = async (taskId, status, reasonText) => {
    setUpdatingId(taskId);
    try {
      const data = {
        status,
        actualTime: status === 'done' ? 30 : (status === 'partial' ? 15 : 0),
        reason: reasonText || ''
      };

      await planApi.updateExecution(plan._id, taskId, data);
      await fetchPlan();
    } catch (error) {
      console.error('Error updating execution:', error);
    } finally {
      setUpdatingId(null);
      setShowReasonModal(false);
      setReason('');
      setPendingStatusUpdate(null);
    }
  };

  const handleReasonSubmit = () => {
    if (!pendingStatusUpdate) return;
    performStatusUpdate(pendingStatusUpdate.id, pendingStatusUpdate.status, reason);
  };

  const finalizeDay = async () => {
    setLoading(true);
    try {
      await summaryApi.createSummary({
        date: currentDate,
        notes: 'End of day review.'
      });
      Alert.alert('Success', 'Day finalized successfully!');
    } catch (error) {
      console.error('Error finalizing day:', error);
      Alert.alert('Error', 'Failed to finalize day');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'done': return 'checkmark-circle';
      case 'partial': return 'remove-circle';
      case 'missed': return 'close-circle';
      default: return 'radio-button-off';
    }
  };

  if (loading) return <Loading />;

  return (
    <View style={styles.container}>
      <Header title="Execution" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 5 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {plan?.isFallback && (
          <Card style={styles.warningCard}>
            <View style={styles.warningContent}>
              <Ionicons name="alert-circle" size={20} color="#F59E0B" />
              <View style={styles.warningText}>
                <Text style={styles.warningTitle}>No plan submitted for today</Text>
                <Text style={styles.warningSubtitle}>Showing default routines. Tracking is limited until you create a plan.</Text>
              </View>
            </View>
            <Button title="Create Plan" onPress={() => { }} variant="outline" size="small" />
          </Card>
        )}

        <Card style={styles.dateCard}>
          <View style={styles.dateNavigation}>
            <TouchableOpacity onPress={() => navigateDate(-1)} style={styles.dateButton}>
              <Ionicons name="chevron-back" size={24} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateCenter}>
              <Text style={styles.dateTitle}>{format(currentDate, 'EEEE, MMM do')}</Text>
              <Text style={styles.dateYear}>{format(currentDate, 'yyyy')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigateDate(1)} style={styles.dateButton}>
              <Ionicons name="chevron-forward" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </Card>

        {plan?.tasks?.length > 0 ? (
          <View style={styles.tasksContainer}>
            {plan.tasks.map((task, idx) => (
              <Card key={task._id || idx} style={styles.taskCard}>
                <View style={styles.taskContent}>
                  <View style={styles.timelineDot} />
                  <View style={styles.taskInfo}>
                    <View style={styles.taskHeader}>
                      <View style={styles.taskLabels}>
                        <View style={[styles.typeBadge, task.type === 'routine' ? styles.routineBadge : styles.todoBadge]}>
                          <Text style={[styles.typeText, task.type === 'routine' ? styles.routineText : styles.todoText]}>{task.type}</Text>
                        </View>
                        <Text style={styles.taskTime}>
                          {task.plannedStart}
                          {task.plannedEnd && task.plannedEnd !== task.plannedStart && ` - ${task.plannedEnd}`}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.taskTitle, task.status === 'done' ? styles.taskTitleCompleted : null]}>
                      {task.title}
                    </Text>
                  </View>
                  <View style={styles.statusButtons}>
                    {updatingId === task._id ? (
                      <Loading size="small" />
                    ) : (
                      <>
                        <TouchableOpacity
                          onPress={() => updateStatus(task._id, 'done')}
                          disabled={plan?.isFallback === true}
                          style={[
                            styles.statusButton,
                            task.status === 'done' ? styles.statusButtonActive : null,
                            { backgroundColor: task.status === 'done' ? '#D1FAE5' : '#F3F4F6' }
                          ]}
                        >
                          <Ionicons
                            name={getStatusIcon(task.status === 'done' ? 'done' : 'radio-button-off')}
                            size={20}
                            color={task.status === 'done' ? '#10B981' : '#D1D5DB'}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => updateStatus(task._id, 'partial')}
                          disabled={plan?.isFallback === true}
                          style={[
                            styles.statusButton,
                            task.status === 'partial' ? styles.statusButtonActive : null,
                            { backgroundColor: task.status === 'partial' ? '#FEF3C7' : '#F3F4F6' }
                          ]}
                        >
                          <Ionicons
                            name={getStatusIcon(task.status === 'partial' ? 'partial' : 'radio-button-off')}
                            size={20}
                            color={task.status === 'partial' ? '#F59E0B' : '#D1D5DB'}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => updateStatus(task._id, 'missed')}
                          disabled={plan?.isFallback === true}
                          style={[
                            styles.statusButton,
                            task.status === 'missed' ? styles.statusButtonActive : null,
                            { backgroundColor: task.status === 'missed' ? '#FEE2E2' : '#F3F4F6' }
                          ]}
                        >
                          <Ionicons
                            name={getStatusIcon(task.status === 'missed' ? 'missed' : 'radio-button-off')}
                            size={20}
                            color={task.status === 'missed' ? '#EF4444' : '#D1D5DB'}
                          />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              </Card>
            ))}
          </View>
        ) : (
          !loading && (
            <View style={styles.emptyState}>
              <Ionicons name="flash-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>
                {!plan ? 'Test Message: No active plan or routines found. Please create a plan to start tracking.' : 'No active tasks in your pool for today. Create a plan to get started!'}
              </Text>
            </View>
          )
        )}
      </ScrollView>

      {/* Floating Action Button (FAB) */}
      {plan && !plan.isFallback && plan.tasks?.length > 0 && (
        <Animated.View style={[styles.fabContainer, { transform: [{ translateY: fabAnim }] }]}>
          <TouchableOpacity style={styles.fab} onPress={finalizeDay}>
            <Ionicons name="checkmark-done" size={28} color="#FFFFFF" />
            <Text style={styles.fabText}>Finalize</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <Modal visible={showReasonModal === true} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIcon}>
                <Ionicons name="alert-circle" size={32} color="#F59E0B" />
              </View>
              <Text style={styles.modalTitle}>Why was this {pendingStatusUpdate?.status}?</Text>
              <Text style={styles.modalSubtitle}>Logging reason helps improve your future planning accuracy.</Text>
            </View>

            <Input
              placeholder="e.g., Unexpected meeting, Low energy, etc."
              value={reason}
              onChangeText={setReason}
              multiline={true}
              numberOfLines={3}
              style={styles.reasonInput}
            />

            <View style={styles.modalButtons}>
              <Button
                title="Skip"
                onPress={() => setShowReasonModal(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Save"
                onPress={handleReasonSubmit}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {showDatePicker && (
        <Modal animationType="fade" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.datePickerModalContent}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
              
              <DateTimePicker
                value={currentDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                style={styles.datePicker}
              />
            </View>
          </View>
        </Modal>
      )}
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
    padding: 16,
  },
  warningCard: {
    marginBottom: 16,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  warningContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  warningText: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 2,
  },
  warningSubtitle: {
    fontSize: 12,
    color: '#B45309',
  },
  dateCard: {
    marginBottom: 16,
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  dateCenter: {
    alignItems: 'center',
    flex: 1,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  dateYear: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  tasksContainer: {
    paddingBottom: 20,
  },
  taskCard: {
    marginBottom: 12,
    position: 'relative',
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineDot: {
    position: 'absolute',
    left: -8,
    top: 20,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  taskInfo: {
    flex: 1,
    marginLeft: 12,
  },
  taskHeader: {
    marginBottom: 4,
  },
  taskLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  routineBadge: { backgroundColor: '#DBEAFE' },
  todoBadge: { backgroundColor: '#F3E8FF' },
  routineText: { color: '#1E40AF', fontSize: 10, fontWeight: '600' },
  todoText: { color: '#6B21A8', fontSize: 10, fontWeight: '600' },
  typeText: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  taskTime: { fontSize: 12, color: '#6B7280' },
  taskTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  taskTitleCompleted: { textDecorationLine: 'line-through', color: '#6B7280' },
  statusButtons: { flexDirection: 'row', gap: 6 },
  statusButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: { color: '#FFFFFF', fontWeight: '700', marginLeft: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  datePickerModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  datePicker: {
    marginBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, width: '100%', maxWidth: 300 },
  modalHeader: { alignItems: 'center', marginBottom: 20 },
  modalIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', textAlign: 'center', marginBottom: 4 },
  modalSubtitle: { fontSize: 12, color: '#6B7280', textAlign: 'center' },
  reasonInput: { marginBottom: 20 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
  },
});

export default ExecutionScreen;
