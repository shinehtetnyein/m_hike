import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ExternalLink } from '@/components/external-link';
import HikeForm from '@/components/hike-form';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';
import { deleteAllHikes, deleteHike, getAllHikes, Hike, updateHike } from '@/lib/database';
import { Image } from 'expo-image';

export default function ExploreScreen() {
  const [hikes, setHikes] = useState<Hike[]>([]);
  const [editingHike, setEditingHike] = useState<Hike | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  const loadHikes = async () => {
    try {
      const hikesList = await getAllHikes();
      setHikes(hikesList);
    } catch (error) {
      console.error('Error loading hikes:', error);
      Alert.alert('Error', 'Failed to load hikes');
    }
  };

  useFocusEffect(() => {
    loadHikes();
  });

  const handleEditHike = (hike: Hike) => {
    setEditingHike(hike);
    setIsEditing(true);
  };

  const handleUpdateHike = async (hikeData: any) => {
    if (!editingHike) return;

    try {
      const updatedHike: Hike = {
        ...editingHike,
        ...hikeData,
        date: hikeData.date.toISOString(),
      };

      await updateHike(updatedHike);

      Alert.alert('Success', 'Hike updated successfully');
      setEditingHike(null);
      setIsEditing(false);
      loadHikes();
    } catch (error) {
      console.error('Error updating hike:', error);
      Alert.alert('Error', 'Failed to update hike');
    }
  };

  const handleDeleteHike = (hike: Hike) => {
    Alert.alert(
      'Delete Hike',
      `Are you sure you want to delete "${hike.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHike(hike.id);
              loadHikes();
              Alert.alert('Success', 'Hike deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete hike');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAllHikes = () => {
    if (hikes.length === 0) {
      Alert.alert('No Hikes', 'There are no hikes to delete');
      return;
    }

    Alert.alert(
      'Delete All Hikes',
      `Are you sure you want to delete all ${hikes.length} hikes? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAllHikes();
              loadHikes();
              Alert.alert('Success', 'All hikes deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete all hikes');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return '#4CAF50';
      case 'Medium': return '#FF9800';
      case 'Hard': return '#F44336';
      case 'Expert': return '#9C27B0';
      default: return '#666';
    }
  };

  // Navigation header with back button
  const NavigationHeader = () => (
    <View style={styles.navigationHeader}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#007AFF" />
        <ThemedText type="defaultSemiBold" style={styles.backButtonText}>
          Back
        </ThemedText>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.addButtonHeader}
        onPress={() => router.push('/(tabs)')}
      >
        <Ionicons name="add" size={20} color="white" />
        <ThemedText type="defaultSemiBold" style={styles.addButtonHeaderText}>
          New Hike
        </ThemedText>
      </TouchableOpacity>
    </View>
  );

  if (isEditing && editingHike) {
    return (
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
        headerImage={
          <IconSymbol
            size={310}
            color="#808080"
            name="chevron.left.forwardslash.chevron.right"
            style={styles.headerImage}
          />
        }>
        <NavigationHeader />
        
        <ThemedView style={styles.titleContainer}>
          <ThemedText
            type="title"
            style={{
              fontFamily: Fonts.rounded,
            }}>
            Edit Hike
          </ThemedText>
        </ThemedView>

        <HikeForm
          onSubmit={handleUpdateHike}
          initialData={editingHike}
          isEditing={true}
          onCancel={() => {
            setEditingHike(null);
            setIsEditing(false);
          }}
        />
      </ParallaxScrollView>
    );
  }

  const renderHikeItem = ({ item }: { item: Hike }) => (
    <ThemedView style={styles.hikeCard}>
      <View style={styles.hikeHeader}>
        <ThemedText type="defaultSemiBold" style={styles.hikeName}>
          {item.name}
        </ThemedText>
        <View style={[
          styles.difficultyBadge,
          { backgroundColor: getDifficultyColor(item.difficulty) }
        ]}>
          <ThemedText style={styles.difficultyText}>
            {item.difficulty}
          </ThemedText>
        </View>
      </View>
      
      <View style={styles.detailRow}>
        <Ionicons name="location-outline" size={16} color="#666" />
        <ThemedText style={styles.hikeLocation}>
          {item.location}
        </ThemedText>
      </View>
      
      <View style={styles.hikeDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <ThemedText style={styles.hikeDetail}>
            {formatDate(item.date)}
          </ThemedText>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="trail-sign-outline" size={16} color="#666" />
          <ThemedText style={styles.hikeDetail}>
            {item.length} km
          </ThemedText>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="car-outline" size={16} color="#666" />
          <ThemedText style={styles.hikeDetail}>
            {item.parking}
          </ThemedText>
        </View>
      </View>

      {item.rating && (
        <View style={styles.detailRow}>
          <Ionicons name="star-outline" size={16} color="#666" />
          <ThemedText style={styles.hikeDetail}>
            {Array(parseInt(item.rating)).fill('★').join('')} ({item.rating}/5)
          </ThemedText>
        </View>
      )}

      {item.weather && (
        <View style={styles.detailRow}>
          <Ionicons name="partly-sunny-outline" size={16} color="#666" />
          <ThemedText style={styles.hikeDetail}>
            {item.weather}
          </ThemedText>
        </View>
      )}

      {item.companions && (
        <View style={styles.detailRow}>
          <Ionicons name="people-outline" size={16} color="#666" />
          <ThemedText style={styles.hikeDetail}>
            {item.companions}
          </ThemedText>
        </View>
      )}

      {item.description && (
        <View style={styles.descriptionContainer}>
          <Ionicons name="document-text-outline" size={16} color="#666" style={styles.descriptionIcon} />
          <ThemedText style={styles.description}>
            {item.description}
          </ThemedText>
        </View>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditHike(item)}
        >
          <Ionicons name="create-outline" size={16} color="white" />
          <ThemedText style={styles.actionButtonText}>Edit</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteHike(item)}
        >
          <Ionicons name="trash-outline" size={16} color="white" />
          <ThemedText style={styles.actionButtonText}>Delete</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.reactLogo}
        />
      }>
      
      <NavigationHeader />

      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
          }}>
          My Hikes
        </ThemedText>
      </ThemedView>

      {hikes.length === 0 ? (
        <ThemedView style={styles.emptyState}>
          <Ionicons name="trail-sign-outline" size={64} color="#666" />
          <ThemedText type="subtitle" style={styles.emptyStateTitle}>
            No Hikes Recorded Yet
          </ThemedText>
          <ThemedText style={styles.emptyStateText}>
            Start your hiking journey by adding your first adventure!
          </ThemedText>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/(tabs)')}
          >
            <Ionicons name="add" size={20} color="white" />
            <ThemedText type="defaultSemiBold" style={styles.addButtonText}>
              Add Your First Hike
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      ) : (
        <>
          <View style={styles.headerActions}>
            <View style={styles.detailRow}>
              <Ionicons name="list-outline" size={16} color="#666" />
              <ThemedText style={styles.hikeCount}>
                {hikes.length} hike{hikes.length !== 1 ? 's' : ''} recorded
              </ThemedText>
            </View>
            
            <View style={styles.dangerActions}>
              <TouchableOpacity
                style={[styles.dangerButton, styles.deleteAllButton]}
                onPress={handleDeleteAllHikes}
              >
                <Ionicons name="trash-outline" size={16} color="white" />
                <ThemedText style={styles.dangerButtonText}>Delete All</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
          
          <FlatList
            data={hikes}
            renderItem={renderHikeItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.listContainer}
          />
        </>
      )}

      <Collapsible title="About This App">
        <ThemedText>
          This hiking tracker helps you record and remember all your outdoor adventures. 
          Track your progress, note the conditions, and build your hiking history.
        </ThemedText>
        <ExternalLink href="https://www.nationaltrust.org.uk/">
          <ThemedText type="link">Find great hiking locations</ThemedText>
        </ExternalLink>
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  reactLogo: {
    height: 280,
    width: 500,
    bottom: 0,
    left: -50,
    position: 'absolute',
  },
  navigationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  addButtonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonHeaderText: {
    color: 'white',
    fontSize: 14,
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hikeCount: {
    fontSize: 16,
    opacity: 0.7,
  },
  dangerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteAllButton: {
    backgroundColor: '#DC3545',
  },
  resetButton: {
    backgroundColor: '#6C757D',
  },
  dangerButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContainer: {
    gap: 12,
    marginBottom: 20,
  },
  hikeCard: {
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  hikeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  hikeName: {
    fontSize: 18,
    flex: 1,
    marginRight: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  hikeLocation: {
    fontSize: 14,
    opacity: 0.8,
  },
  hikeDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  hikeDetail: {
    fontSize: 14,
  },
  descriptionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 4,
  },
  descriptionIcon: {
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    fontStyle: 'italic',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 6,
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#DC3545',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  emptyStateTitle: {
    textAlign: 'center',
  },
  emptyStateText: {
    textAlign: 'center',
    opacity: 0.7,
    fontSize: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,  
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  addButtonText: {
    color: 'white',
  },
});