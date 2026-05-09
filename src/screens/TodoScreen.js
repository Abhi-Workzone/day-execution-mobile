import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { taskApi } from '../api';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Loading from '../components/Loading';

const TodoScreen = () => {
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    type: 'flexible',
    estimatedTime: 0,
    deadline: ''
  });

  useEffect(() => {
    if (activeTab === 'active') {
      fetchTasks();
    } else {
      fetchCompletedTasks();
    }
  }, [activeTab, filterMonth, filterYear]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await taskApi.getTasks();
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedTasks = async () => {
    setLoading(true);
    try {
      const response = await taskApi.getCompletedTasks(filterMonth, filterYear);
      setCompletedTasks(response.data);
    } catch (error) {
      console.error('Error fetching completed tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      if (editingId) {
        await taskApi.updateTask(editingId, newTask);
      } else {
        await taskApi.createTask(newTask);
      }
      handleCloseModal();
      fetchTasks();
    } catch (error) {
      console.error('Error saving task:', error);
      Alert.alert('Error', 'Failed to save task');
    }
  };

  const handleEdit = (task) => {
    setEditingId(task._id);
    setNewTask({
      title: task.title,
      description: task.description || '',
      type: task.type,
      estimatedTime: task.estimatedTime,
      deadline: task.deadline ? task.deadline.split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setNewTask({ title: '', description: '', type: 'flexible', estimatedTime: 0, deadline: '' });
  };

  const handleDelete = async (id) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await taskApi.deleteTask(id);
              fetchTasks();
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert('Error', 'Failed to delete task');
            }
          }
        }
      ]
    );
  };

  if (loading) return <Loading />;

  return (
    <View style={styles.container}>
      <Header title="Todo Pool" />
      <View style={styles.header}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'active' ? styles.tabActive : null]}
            onPress={() => setActiveTab('active')}
          >
            <Text style={[styles.tabText, activeTab === 'active' ? styles.tabTextActive : null]}>
              Active
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'completed' ? styles.tabActive : null]}
            onPress={() => setActiveTab('completed')}
          >
            <Text style={[styles.tabText, activeTab === 'completed' ? styles.tabTextActive : null]}>
              Completed
            </Text>
          </TouchableOpacity>
        </View>
        
        {activeTab === 'completed' && (
          <View style={styles.filterContainer}>
            <View style={styles.monthFilter}>
              <Text style={styles.filterLabel}>Month:</Text>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => {
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  const nextMonth = (filterMonth + 1) % 12;
                  setFilterMonth(nextMonth);
                }}
              >
                <Text style={styles.filterText}>
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][filterMonth]}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.yearFilter}>
              <Text style={styles.filterLabel}>Year:</Text>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => {
                  const years = [2024, 2025, 2026];
                  const currentIndex = years.indexOf(filterYear);
                  const nextYear = years[(currentIndex + 1) % years.length];
                  setFilterYear(nextYear);
                }}
              >
                <Text style={styles.filterText}>{filterYear}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={styles.tasksContainer}>
          {(activeTab === 'active' ? tasks : completedTasks).map(task => (
            <Card key={task._id} style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <View style={styles.taskLabels}>
                  <View style={[
                    styles.typeBadge,
                    task.status === 'completed' ? styles.completedBadge :
                    task.type === 'time-bound' ? styles.timeBoundBadge : styles.flexibleBadge
                  ]}>
                    <Text style={[
                      styles.typeText,
                      task.status === 'completed' ? styles.completedText :
                      task.type === 'time-bound' ? styles.timeBoundText : styles.flexibleText
                    ]}>
                      {task.status === 'completed' ? 'Done' : task.type}
                    </Text>
                  </View>
                </View>
                <View style={styles.taskActions}>
                  {activeTab === 'active' && (
                    <>
                      <TouchableOpacity onPress={() => handleEdit(task)} style={styles.actionButton}>
                        <Ionicons name="pencil" size={16} color="#6B7280" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(task._id)} style={styles.actionButton}>
                        <Ionicons name="trash" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
              <Text style={[
                styles.taskTitle,
                task.status === 'completed' ? styles.taskTitleCompleted : null
              ]}>
                {task.title}
              </Text>
              <Text style={styles.taskDescription}>
                {task.description || 'No description provided.'}
              </Text>
                <View style={styles.taskMeta}>
                {task.estimatedTime > 0 && (
                  <View style={styles.metaItem}>
                    <Ionicons name="time" size={12} color="#6B7280" />
                    <Text style={styles.metaText}>{task.estimatedTime}m</Text>
                  </View>
                )}
                {task.status === 'completed' ? (
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar" size={12} color="#6B7280" />
                    <Text style={styles.metaText}>
                      Done on {new Date(task.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                ) : (
                  task.deadline && (
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar" size={12} color="#6B7280" />
                      <Text style={styles.metaText}>
                        {new Date(task.deadline).toLocaleDateString()}
                      </Text>
                    </View>
                  )
                )}
              </View>
            </Card>
          ))}
        </View>

        {activeTab === 'active' && tasks.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="list-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No active tasks in your pool. Add some to get started!</Text>
          </View>
        )}

        {activeTab === 'completed' && completedTasks.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No completed tasks found for this month.</Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button (FAB) */}
      {activeTab === 'active' && (
        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => setShowModal(true)}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
          <Text style={styles.fabText}>Add Task</Text>
        </TouchableOpacity>
      )}

      <Modal visible={showModal === true} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingId ? 'Edit Task' : 'New Task'}
            </Text>
            
            <View style={styles.form}>
              <Input
                placeholder="Title"
                value={newTask.title}
                onChangeText={(text) => setNewTask({...newTask, title: text})}
                style={styles.input}
              />

              <Text style={styles.label}>Description</Text>
              <Input
                placeholder="Task description..."
                value={newTask.description}
                onChangeText={(text) => setNewTask({...newTask, description: text})}
                multiline={true}
                numberOfLines={3}
                style={styles.textArea}
              />
            </View>

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={handleCloseModal}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title={editingId ? 'Update Task' : 'Create Task'}
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
    paddingStart: 16,
    paddingEnd: 16,
    paddingTop: 5,
    paddingBottom: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#3B82F6',
  },
  addButton: {
    alignSelf: 'flex-end',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  monthFilter: {
    flex: 1,
  },
  yearFilter: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  filterButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  tasksContainer: {
    paddingBottom: 20,
  },
  taskCard: {
    marginBottom: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  completedBadge: {
    backgroundColor: '#D1FAE5',
  },
  timeBoundBadge: {
    backgroundColor: '#FED7AA',
  },
  flexibleBadge: {
    backgroundColor: '#DBEAFE',
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  completedText: {
    color: '#065F46',
  },
  timeBoundText: {
    color: '#9A3412',
  },
  flexibleText: {
    color: '#1E40AF',
  },
  taskActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  taskDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  taskMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 8,
    fontSize: 16,
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  typeSelectorText: {
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
  },
});

export default TodoScreen;
