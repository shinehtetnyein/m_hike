import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';

import HikeForm from '@/components/hike-form';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import { addHike, deleteHike, getAllHikes, Hike } from '@/lib/database';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();
  const [section, setSection] = useState<'menu' | 'form' | 'list'>('menu');
  const [hikes, setHikes] = useState<Hike[]>([]);

  // Load hikes whenever list view opens
  useEffect(() => {
    if (section === 'list') {
      getAllHikes()
        .then(setHikes)
        .catch(() => Alert.alert('Error', 'Failed to load hikes'));
    }
  }, [section]);

  // Save new hike
  const handleHikeSubmit = async (hikeData: any) => {
    try {
      const newHike: Hike = {
        id: Date.now().toString(),
        name: hikeData.name,
        location: hikeData.location,
        date: hikeData.date?.toISOString?.() || String(hikeData.date),
        parking: hikeData.parking,
        length: hikeData.length,
        difficulty: hikeData.difficulty,
        description: hikeData.description,
        weather: hikeData.weather,
        rating: hikeData.rating,
        companions: hikeData.companions,
        createdAt: new Date().toISOString(),
      };

      await addHike(newHike);
      // Remove the setSection('menu') call here since we'll handle it in onSuccess
    } catch (error) {
      Alert.alert('Error', 'Failed to save hike');
    }
  };

  // Handle successful form submission
  const handleFormSuccess = () => {
    setSection('menu'); // Go back to main menu after success
  };

  // Delete a hike
  const handleDeleteHike = async (id: string) => {
    try {
      await deleteHike(id);
      getAllHikes().then(setHikes);
    } catch {
      Alert.alert('Error', 'Failed to delete hike');
    }
  };

  // Edit placeholder
  const handleEditHike = (hike: Hike) => {
    Alert.alert('Edit', 'Edit feature coming soon!');
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Hike Tracker!</ThemedText>
      </ThemedView>

      {/* MENU SECTION */}
      {section === 'menu' && (
        <View>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => setSection('form')}
          >
            <Ionicons name="add-circle-outline" size={32} color="#34C759" />
            <ThemedText type="defaultSemiBold" style={styles.statNumber}>
              Add New
            </ThemedText>
            <ThemedText style={styles.statLabel}>
              Record a new hike
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* ADD FORM SECTION */}
      {section === 'form' && (
        <ThemedView style={styles.formContainer}>
          <HikeForm 
            onSubmit={handleHikeSubmit} 
            onSuccess={handleFormSuccess} // Add this prop
          />

          <TouchableOpacity
            style={{ marginTop: 12 }}
            onPress={() => setSection('menu')}
          >
            <ThemedText style={{ color: '#007AFF', textAlign: 'center' }}>
              Cancel
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      )}

      {/* HIKES LIST SECTION */}
      {section === 'list' && (
        <ThemedView style={styles.listContainer}>
          <ThemedText
            type="subtitle"
            style={{ textAlign: 'center', marginBottom: 12 }}
          >
            My Hikes
          </ThemedText>

          {hikes.length === 0 ? (
            <ThemedText
              style={{ textAlign: 'center', opacity: 0.7 }}
            >
              No hikes recorded yet.
            </ThemedText>
          ) : (
            hikes.map(
              (hike) =>
                hike &&
                hike.id && (
                  <View key={hike.id} style={styles.hikeCardStyled}>
                    <View style={styles.row}>
                      <Ionicons
                        name="walk-outline"
                        size={22}
                        color="#007AFF"
                        style={{ marginRight: 8 }}
                      />
                      <ThemedText type="defaultSemiBold" style={{ fontSize: 18 }}>
                        {hike.name}
                      </ThemedText>
                    </View>

                    <View style={styles.row}>
                      <Ionicons name="location-outline" size={18} color="#34C759" />
                      <ThemedText style={styles.rowText}>{hike.location}</ThemedText>
                    </View>

                    <View style={styles.row}>
                      <Ionicons name="calendar-outline" size={18} color="#FF9500" />
                      <ThemedText style={styles.rowText}>
                        {new Date(hike.date).toLocaleDateString()}
                      </ThemedText>
                    </View>

                    <View style={styles.row}>
                      <Ionicons name="barbell-outline" size={18} color="#AF52DE" />
                      <ThemedText style={styles.rowText}>{hike.length} km</ThemedText>
                    </View>

                    <View style={styles.row}>
                      <Ionicons name="cloud-outline" size={18} color="#5AC8FA" />
                      <ThemedText style={styles.rowText}>{hike.weather}</ThemedText>
                    </View>

                    <View style={styles.row}>
                      <Ionicons name="people-outline" size={18} color="#FF2D55" />
                      <ThemedText style={styles.rowText}>{hike.companions}</ThemedText>
                    </View>

                    <ThemedText style={{ marginBottom: 8 }}>
                      {hike.description}
                    </ThemedText>

                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={styles.cardButton}
                        onPress={() => handleEditHike(hike)}
                      >
                        <Ionicons name="create-outline" size={18} color="#007AFF" />
                        <ThemedText style={styles.cardButtonText}>Edit</ThemedText>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.cardButton, { backgroundColor: '#FF3B30' }]}
                        onPress={() => handleDeleteHike(hike.id)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#fff" />
                        <ThemedText
                          style={[styles.cardButtonText, { color: '#fff' }]}
                        >
                          Delete
                        </ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>
                )
            )
          )}

          <TouchableOpacity
            style={{ marginTop: 12 }}
            onPress={() => setSection('menu')}
          >
            <ThemedText style={{ color: '#007AFF', textAlign: 'center' }}>
              Back
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      )}
    </ParallaxScrollView>
  );
}


const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },

  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },

  statNumber: { fontSize: 16, marginTop: 8, marginBottom: 4 },
  statLabel: { fontSize: 12, opacity: 0.7, textAlign: 'center' },

  formContainer: { gap: 16, marginBottom: 20 },

  listContainer: {
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,122,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,122,255,0.2)',
  },

  hikeCardStyled: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
  },

  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  rowText: { marginLeft: 6, fontSize: 15 },

  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },

  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F2F2F7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },

  cardButtonText: { fontSize: 15, color: '#007AFF', fontWeight: '500' },

  reactLogo: {
    height: 280,
    width: 500,
    bottom: 0,
    left: -50,
    position: 'absolute',
  },
});
