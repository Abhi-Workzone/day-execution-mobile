import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { routineApi } from '../api';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Loading from '../components/Loading';

const RoutineScreen = () => {
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newRoutine, setNewRoutine] = useState({
    title: '',
    startTime: '08:00',
    duration: 60,
    daysOfWeek: []
  });

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    fetchRoutines();
  }, []);

  const fetchRoutines = async () => {
    try {
      const response = await routineApi.getRoutines();
      const sortedRoutines = response.data.sort((a, b) => a.startTime.localeCompare(b.startTime));
      setRoutines(sortedRoutines);
    } catch (error) {
      console.error('Error fetching routines:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (index) => {
    const current = [...newRoutine.daysOfWeek];
    if (current.includes(index)) {
      setNewRoutine({...newRoutine, daysOfWeek: current.filter(d => d !== index)});
    } else {
      setNewRoutine({...newRoutine, daysOfWeek: [...current, index]});
    }
  };

  const handleCreate = async () => {
    if (newRoutine.daysOfWeek.length === 0) {
      Alert.alert('Error', 'Please select at least one day');
      return;
    }
    
    try {
      if (editingId) {
        await routineApi.updateRoutine(editingId, newRoutine);
      } else {
        await routineApi.createRoutine(newRoutine);
      }
      handleCloseModal();
      fetchRoutines();
    } catch (error) {
      console.error('Error saving routine:', error);
      Alert.alert('Error', 'Failed to save routine');
    }
  };

  const handleEdit = (routine) => {
    setEditingId(routine._id);
    setNewRoutine({
      title: routine.title,
      startTime: routine.startTime,
      duration: routine.duration,
      daysOfWeek: routine.daysOfWeek
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setNewRoutine({ title: '', startTime: '08:00', duration: 60, daysOfWeek: [] });
  };

  const handleDelete = async (id) => {
    Alert.alert(
      'Delete Routine',
      'Are you sure you want to delete this routine?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await routineApi.deleteRoutine(id);
              fetchRoutines();
            } catch (error) {
              console.error('Error deleting routine:', error);
              Alert.alert('Error', 'Failed to delete routine');
            }
          }
        }
      ]
    );
  };

  if (loading) return <Loading />;

  return (
    <View style={styles.container}>
      <Header title="Weekly Routines" />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 10 }}
      >
        <View style={styles.routinesContainer}>
          {routines.map(routine => (
            <Card key={routine._id} style={styles.routineCard}>
              <View style={styles.routineHeader}>
                <Text style={styles.routineTitle}>{routine.title}</Text>
                <View style={styles.routineActions}>
                  <TouchableOpacity onPress={() => handleEdit(routine)} style={styles.actionButton}>
                    <Ionicons name="pencil" size={16} color="#6B7280" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(routine._id)} style={styles.actionButton}>
                    <Ionicons name="trash" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.routineTime}>
                <View style={styles.timeBadge}>
                  <Ionicons name="time" size={12} color="#3B82F6" />
                  <Text style={styles.timeText}>{routine.startTime}</Text>
                </View>
                {routine.duration > 0 && (
                  <Text style={styles.durationText}>{routine.duration} mins</Text>
                )}
              </View>

              <View style={styles.daysContainer}>
                {days.map((day, i) => (
                  <View
                    key={day}
                    style={[
                      styles.dayButton,
                      routine.daysOfWeek.includes(i) ? styles.dayButtonSelected : styles.dayButtonUnselected
                    ]}
                  >
                    <Text style={[
                      styles.dayText,
                      routine.daysOfWeek.includes(i) ? styles.dayTextSelected : styles.dayTextUnselected
                    ]}>
                      {day[0]}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          ))}
        </View>

        {routines.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="repeat-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>Your routine pool is empty. Create one to build consistency!</Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => setShowModal(true)}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
        <Text style={styles.fabText}>Add Routine</Text>
      </TouchableOpacity>

      <Modal visible={showModal === true} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingId ? 'Edit Routine' : 'New Routine'}
            </Text>
            
            <View style={styles.form}>
              <Text style={styles.label}>Title</Text>
              <Input
                placeholder="Routine title"
                value={newRoutine.title}
                onChangeText={(text) => setNewRoutine({...newRoutine, title: text})}
                style={styles.input}
              />

              <View style={styles.row}>
                <View style={styles.half}>
                  <Text style={styles.label}>Start Time</Text>
                  <Input
                    value={newRoutine.startTime}
                    onChangeText={(text) => setNewRoutine({...newRoutine, startTime: text})}
                    style={styles.input}
                  />
                </View>
                <View style={styles.half}>
                  <Text style={styles.label}>Duration (min)</Text>
                  <Input
                    placeholder="0"
                    value={newRoutine.duration.toString()}
                    onChangeText={(text) => setNewRoutine({...newRoutine, duration: parseInt(text) || 0})}
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </View>
              </View>

              <Text style={styles.label}>Repeating Days</Text>
              <View style={styles.daysSelector}>
                {days.map((day, i) => (
                  <TouchableOpacity
                    key={day}
                    onPress={() => toggleDay(i)}
                    style={[
                      styles.daySelectorButton,
                      newRoutine.daysOfWeek.includes(i) ? styles.daySelectorButtonSelected : styles.daySelectorButtonUnselected
                    ]}
                  >
                    <Text style={[
                      styles.daySelectorText,
                      newRoutine.daysOfWeek.includes(i) ? styles.daySelectorTextSelected : styles.daySelectorTextUnselected
                    ]}>
                      {day[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={handleCloseModal}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title={editingId ? 'Update Routine' : 'Create Routine'}
                onPress={handleCreate}
                style={styles.modalButton}
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
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  createButton: {
    minWidth: 120,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#3B82F6',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  routinesContainer: {
    paddingBottom: 20,
  },
  routineCard: {
    marginBottom: 16,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  routineTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  routineActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  routineTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
  },
  durationText: {
    fontSize: 14,
    color: '#6B7280',
  },
  daysContainer: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  dayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dayButtonSelected: {
    backgroundColor: '#1F2937',
    borderColor: '#1F2937',
  },
  dayButtonUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  dayText: {
    fontSize: 10,
    fontWeight: '600',
  },
  dayTextSelected: {
    color: '#FFFFFF',
  },
  dayTextUnselected: {
    color: '#9CA3AF',
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  input: {
    marginBottom: 0,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  daysSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  daySelectorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelectorButtonSelected: {
    backgroundColor: '#3B82F6',
  },
  daySelectorButtonUnselected: {
    backgroundColor: '#F3F4F6',
  },
  daySelectorText: {
    fontSize: 12,
    fontWeight: '600',
  },
  daySelectorTextSelected: {
    color: '#FFFFFF',
  },
  daySelectorTextUnselected: {
    color: '#6B7280',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
  },
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

export default RoutineScreen;
