import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { summaryApi } from '../api';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import Card from '../components/Card';
import Loading from '../components/Loading';

const { width } = Dimensions.get('window');

const AnalyticsScreen = () => {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchSummaries();
    }, [])
  );

  const fetchSummaries = async () => {
    try {
      const response = await summaryApi.getAllSummaries();
      setSummaries(response.data);
    } catch (error) {
      console.error('Error fetching summaries:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  const latest = summaries[0] || {
    completionRate: 0,
    accuracyScore: 0,
    plannedTime: 0,
    actualTime: 0
  };

  const StatCard = ({ icon, label, value, color }) => (
    <Card style={[styles.statCard, { backgroundColor: color }]}>
      <View style={styles.statContent}>
        <View style={styles.statIcon}>
          {icon}
        </View>
        <View style={styles.statInfo}>
          <Text style={styles.statLabel}>{label}</Text>
          <Text style={styles.statValue}>{value}</Text>
        </View>
      </View>
    </Card>
  );

  const ProgressBar = ({ progress, color }) => (
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: color }]} />
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Analytics" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Analytics</Text>
            <Text style={styles.subtitle}>Performance insights and execution history</Text>
          </View>

          {/* Stats Overview */}
          <View style={styles.statsContainer}>
            <StatCard
              icon={<Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />}
              label="Avg Completion"
              value={`${Math.round(latest.completionRate)}%`}
              color="#10B981"
            />
            <StatCard
              icon={<Ionicons name="target" size={24} color="#FFFFFF" />}
              label="Accuracy Score"
              value={`${Math.round(latest.accuracyScore)}%`}
              color="#3B82F6"
            />
            <StatCard
              icon={<Ionicons name="time" size={24} color="#FFFFFF" />}
              label="Planned Hours"
              value={`${(latest.plannedTime / 60).toFixed(1)}h`}
              color="#8B5CF6"
            />
            <StatCard
              icon={<Ionicons name="trending-up" size={24} color="#FFFFFF" />}
              label="Actual Hours"
              value={`${(latest.actualTime / 60).toFixed(1)}h`}
              color="#F59E0B"
            />
          </View>

          {/* History Table */}
          <Card style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Execution History</Text>
            </View>
            <View style={styles.tableContainer}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.dateColumn]}>Date</Text>
                <Text style={[styles.tableHeaderText, styles.timeColumn]}>Planned</Text>
                <Text style={[styles.tableHeaderText, styles.timeColumn]}>Actual</Text>
                <Text style={[styles.tableHeaderText, styles.progressColumn]}>Completion</Text>
                <Text style={[styles.tableHeaderText, styles.accuracyColumn]}>Accuracy</Text>
              </View>
              {summaries.map(s => (
                <View key={s._id} style={styles.tableRow}>
                  <Text style={[styles.tableCellText, styles.dateColumn]}>
                    {format(new Date(s.date), 'MMM dd, yyyy')}
                  </Text>
                  <Text style={[styles.tableCellText, styles.timeColumn]}>
                    {Math.round(s.plannedTime / 60)}h
                  </Text>
                  <Text style={[styles.tableCellText, styles.timeColumn]}>
                    {Math.round(s.actualTime / 60)}h
                  </Text>
                  <View style={[styles.progressColumn, styles.progressCell]}>
                    <ProgressBar progress={s.completionRate} color="#10B981" />
                    <Text style={styles.progressText}>{Math.round(s.completionRate)}%</Text>
                  </View>
                  <View style={[styles.accuracyColumn, styles.accuracyCell]}>
                    <View style={[
                      styles.accuracyBadge,
                      { backgroundColor: s.accuracyScore > 80 ? '#D1FAE5' : '#FED7AA' }
                    ]}>
                      <Text style={[
                        styles.accuracyText,
                        { color: s.accuracyScore > 80 ? '#065F46' : '#9A3412' }
                      ]}>
                        {Math.round(s.accuracyScore)}%
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </Card>

          {/* Insights Section */}
          <Card style={styles.insightsCard}>
            <Text style={styles.insightsTitle}>Miss Reasons Breakdown</Text>
            <View style={styles.insightsContent}>
              {latest.notes ? (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesText}>"{latest.notes}"</Text>
                </View>
              ) : (
                <Text style={styles.noNotesText}>No specific reasons recorded for latest session.</Text>
              )}
              <View style={styles.insightsDivider} />
              <View style={styles.keyInsights}>
                <Text style={styles.keyInsightsTitle}>Key Insights</Text>
                <View style={styles.insightItem}>
                  <View style={styles.insightDot} />
                  <Text style={styles.insightText}>
                    Planning accuracy: {latest.accuracyScore > 90 ? 'Excellent' : 'Needs improvement'}
                  </Text>
                </View>
                <View style={styles.insightItem}>
                  <View style={[styles.insightDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.insightText}>
                    Execution rate: {latest.completionRate > 80 ? 'Consistent' : 'Varies'}
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
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
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 48) / 2,
    maxWidth: (width - 48) / 2,
    padding: 16,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    marginRight: 12,
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  historyCard: {
    marginBottom: 24,
  },
  historyHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  tableContainer: {
    paddingHorizontal: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  dateColumn: {
    flex: 2,
  },
  timeColumn: {
    flex: 1,
  },
  progressColumn: {
    flex: 2,
  },
  accuracyColumn: {
    flex: 1.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableCellText: {
    fontSize: 14,
    color: '#1F2937',
  },
  progressCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  accuracyCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  accuracyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  accuracyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  insightsCard: {
    marginBottom: 24,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  insightsContent: {
    padding: 16,
  },
  notesContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  notesText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  noNotesText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  insightsDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  keyInsights: {
    gap: 8,
  },
  keyInsightsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  insightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
  },
  insightText: {
    fontSize: 14,
    color: '#1F2937',
  },
});

export default AnalyticsScreen;
