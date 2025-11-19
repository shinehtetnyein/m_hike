import { Hike } from '@/lib/database';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface HikeFormData {
  name: string;
  location: string;
  date: Date;
  parking: string;
  length: string;
  difficulty: string;
  description: string;
  weather: string;
  rating: string;
  companions: string;
}

interface FieldErrors {
  name?: string;
  location?: string;
  date?: string;
  parking?: string;
  length?: string;
  difficulty?: string;
  description?: string;
  weather?: string;
  rating?: string;
  companions?: string;
}

interface HikeFormProps {
  onSubmit: (data: HikeFormData) => void;
  initialData?: Hike | null;
  isEditing?: boolean;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export default function HikeForm({ 
  onSubmit, 
  initialData, 
  isEditing = false, 
  onCancel,
  onSuccess 
}: HikeFormProps) {
  
  const [formData, setFormData] = useState<HikeFormData>({
    name: '',
    location: '',
    date: new Date(),
    parking: 'Yes',
    length: '',
    difficulty: 'Medium',
    description: '',
    weather: '',
    rating: '',
    companions: '',
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<keyof HikeFormData>>(new Set());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        location: initialData.location,
        date: new Date(initialData.date),
        parking: initialData.parking,
        length: initialData.length,
        difficulty: initialData.difficulty,
        description: initialData.description,
        weather: initialData.weather,
        rating: initialData.rating,
        companions: initialData.companions,
      });
    }
  }, [initialData]);

  const handleInputChange = (field: keyof HikeFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Mark field as touched
    setTouchedFields(prev => new Set(prev).add(field));
    
    // Clear error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        date: selectedDate
      }));
      setTouchedFields(prev => new Set(prev).add('date'));
      
      // Clear date error
      if (fieldErrors.date) {
        setFieldErrors(prev => ({
          ...prev,
          date: undefined
        }));
      }
    }
  };

  const validateField = (field: keyof HikeFormData, value: string): string | undefined => {
    switch (field) {
      case 'name':
        if (!value || value.trim() === '') {
          return 'Hike name is required';
        }
        if (value.trim().length < 2) {
          return 'Hike name must be at least 2 characters';
        }
        if (value.trim().length > 100) {
          return 'Hike name must be less than 100 characters';
        }
        return undefined;

      case 'location':
        if (!value || value.trim() === '') {
          return 'Location is required';
        }
        if (value.trim().length < 2) {
          return 'Location must be at least 2 characters';
        }
        if (value.trim().length > 100) {
          return 'Location must be less than 100 characters';
        }
        return undefined;

      case 'date':
        const date = formData.date;
        if (!date || isNaN(date.getTime())) {
          return 'Valid date is required';
        }
        if (date > new Date()) {
          return 'Date cannot be in the future';
        }
        const hundredYearsAgo = new Date();
        hundredYearsAgo.setFullYear(hundredYearsAgo.getFullYear() - 100);
        if (date < hundredYearsAgo) {
          return 'Date seems too far in the past';
        }
        return undefined;

      case 'length':
        if (!value || value.trim() === '') {
          return 'Hike length is required';
        }
        const lengthNum = parseFloat(value);
        if (isNaN(lengthNum)) {
          return 'Please enter a valid number';
        }
        if (lengthNum <= 0) {
          return 'Length must be greater than 0';
        }
        if (lengthNum > 1000) {
          return 'Length seems too long (max 1000 km)';
        }
        if (!/^\d*\.?\d*$/.test(value)) {
          return 'Please enter a valid decimal number';
        }
        return undefined;

      case 'difficulty':
        if (!value || value.trim() === '') {
          return 'Difficulty level is required';
        }
        return undefined;

      case 'parking':
        if (!value || value.trim() === '') {
          return 'Parking information is required';
        }
        return undefined;

      case 'description':
        if (value && value.length > 1000) {
          return 'Description must be less than 1000 characters';
        }
        return undefined;

      case 'weather':
        if (value && value.length > 50) {
          return 'Weather description must be less than 50 characters';
        }
        return undefined;

      case 'rating':
        if (value && value !== '') {
          const ratingNum = parseInt(value);
          if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return 'Rating must be between 1 and 5';
          }
        }
        return undefined;

      case 'companions':
        if (value && value.length > 100) {
          return 'Companions list must be less than 100 characters';
        }
        return undefined;

      default:
        return undefined;
    }
  };

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};
    let isValid = true;

    // Required fields
    const requiredFields: (keyof HikeFormData)[] = ['name', 'location', 'length', 'difficulty', 'parking'];
    
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        errors[field] = error;
        isValid = false;
      }
    });

    // Validate date separately
    const dateError = validateField('date', '');
    if (dateError) {
      errors.date = dateError;
      isValid = false;
    }

    // Validate optional fields only if they have values
    const optionalFields: (keyof HikeFormData)[] = ['description', 'weather', 'rating', 'companions'];
    
    optionalFields.forEach(field => {
      if (formData[field]) {
        const error = validateField(field, formData[field]);
        if (error) {
          errors[field] = error;
          isValid = false;
        }
      }
    });

    setFieldErrors(errors);
    
    // Mark all fields as touched to show errors
    if (!isValid) {
      const allFields: (keyof HikeFormData)[] = ['name', 'location', 'date', 'parking', 'length', 'difficulty', 'description', 'weather', 'rating', 'companions'];
      setTouchedFields(new Set(allFields));
    }

    return isValid;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      setShowConfirmation(true);
    }
  };

  const handleConfirm = () => {
    onSubmit(formData);
    setShowConfirmation(false);
    setShowSuccess(true);

    setTimeout(() => {
      setShowSuccess(false);
      if (onSuccess) {
        onSuccess();
      }
    }, 2000);

    if (!isEditing) {
      setFormData({
        name: '',
        location: '',
        date: new Date(),
        parking: 'Yes',
        length: '',
        difficulty: 'Medium',
        description: '',
        weather: '',
        rating: '',
        companions: '',
      });
      setFieldErrors({});
      setTouchedFields(new Set());
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    if (onSuccess) {
      onSuccess();
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInputStyle = (field: keyof HikeFormData) => {
    const hasError = fieldErrors[field] && touchedFields.has(field);
    return [
      styles.textInput,
      hasError && styles.errorInput,
      field === 'description' && styles.textArea
    ];
  };

  const getPickerStyle = (field: keyof HikeFormData) => {
    const hasError = fieldErrors[field] && touchedFields.has(field);
    return [
      styles.pickerContainer,
      hasError && styles.errorInput
    ];
  };

  const getDateButtonStyle = () => {
    const hasError = fieldErrors.date && touchedFields.has('date');
    return [
      styles.dateButton,
      hasError && styles.errorInput
    ];
  };

  // SUCCESS POPUP
  if (showSuccess) {
    return (
      <ThemedView style={styles.successContainer}>
        <Ionicons name="checkmark-circle" size={70} color="#28A745" />
        <ThemedText type="subtitle" style={styles.successTitle}>
          {isEditing ? "Changes Saved!" : "Hike Added Successfully!"}
        </ThemedText>
        <ThemedText style={styles.successMessage}>
          Your hike details have been saved successfully.
        </ThemedText>
        <TouchableOpacity
          style={[styles.button, styles.okButton]}
          onPress={handleSuccessClose}
        >
          <ThemedText type="defaultSemiBold" style={styles.buttonText}>
            OK
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  // CONFIRMATION SCREEN
  if (showConfirmation) {
    return (
      <ThemedView style={styles.confirmationContainer}>
        <ThemedText type="subtitle" style={styles.confirmationTitle}>
          {isEditing ? 'Confirm Changes' : 'Confirm Hike Details'}
        </ThemedText>
        
        <ThemedView style={styles.confirmationDetails}>
          <ThemedText><ThemedText type="defaultSemiBold">Name:</ThemedText> {formData.name}</ThemedText>
          <ThemedText><ThemedText type="defaultSemiBold">Location:</ThemedText> {formData.location}</ThemedText>
          <ThemedText><ThemedText type="defaultSemiBold">Date:</ThemedText> {formatDate(formData.date)}</ThemedText>
          <ThemedText><ThemedText type="defaultSemiBold">Parking:</ThemedText> {formData.parking}</ThemedText>
          <ThemedText><ThemedText type="defaultSemiBold">Length:</ThemedText> {formData.length} km</ThemedText>
          <ThemedText><ThemedText type="defaultSemiBold">Difficulty:</ThemedText> {formData.difficulty}</ThemedText>
          {formData.description ? (
            <ThemedText><ThemedText type="defaultSemiBold">Description:</ThemedText> {formData.description}</ThemedText>
          ) : null}
          {formData.weather ? (
            <ThemedText><ThemedText type="defaultSemiBold">Weather:</ThemedText> {formData.weather}</ThemedText>
          ) : null}
          {formData.rating ? (
            <ThemedText><ThemedText type="defaultSemiBold">Rating:</ThemedText> {formData.rating}/5</ThemedText>
          ) : null}
          {formData.companions ? (
            <ThemedText><ThemedText type="defaultSemiBold">Companions:</ThemedText> {formData.companions}</ThemedText>
          ) : null}
        </ThemedView>

        <View style={styles.confirmationButtons}>
          <TouchableOpacity
            style={[styles.button, styles.editButton]}
            onPress={() => setShowConfirmation(false)}
          >
            <ThemedText type="defaultSemiBold" style={styles.buttonText}>
              Edit Details
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.confirmButton]}
            onPress={handleConfirm}
          >
            <ThemedText type="defaultSemiBold" style={styles.buttonText}>
              {isEditing ? 'Save Changes' : 'Confirm & Save'}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  // MAIN FORM
  return (
    <ScrollView style={styles.container}>
      
      {/* Name */}
      <ThemedView style={styles.formGroup}>
        <ThemedText type="defaultSemiBold">Hike Name *</ThemedText>
        <TextInput
          style={getInputStyle('name')}
          value={formData.name}
          onChangeText={(v) => handleInputChange('name', v)}
          placeholder="e.g., Snowdon, Trosley Country Park"
        />
        {fieldErrors.name && touchedFields.has('name') && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={16} color="#DC3545" />
            <ThemedText style={styles.errorText}>{fieldErrors.name}</ThemedText>
          </View>
        )}
      </ThemedView>

      {/* Location */}
      <ThemedView style={styles.formGroup}>
        <ThemedText type="defaultSemiBold">Location *</ThemedText>
        <TextInput
          style={getInputStyle('location')}
          value={formData.location}
          onChangeText={(v) => handleInputChange('location', v)}
          placeholder="e.g., Wales, UK"
        />
        {fieldErrors.location && touchedFields.has('location') && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={16} color="#DC3545" />
            <ThemedText style={styles.errorText}>{fieldErrors.location}</ThemedText>
          </View>
        )}
      </ThemedView>

      {/* Date */}
      <ThemedView style={styles.formGroup}>
        <ThemedText type="defaultSemiBold">Date *</ThemedText>
        <TouchableOpacity
          style={getDateButtonStyle()}
          onPress={() => setShowDatePicker(true)}
        >
          <ThemedText>{formatDate(formData.date)}</ThemedText>
        </TouchableOpacity>
        {fieldErrors.date && touchedFields.has('date') && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={16} color="#DC3545" />
            <ThemedText style={styles.errorText}>{fieldErrors.date}</ThemedText>
          </View>
        )}

        {showDatePicker && (
          <DateTimePicker
            value={formData.date}
            mode="date"
            onChange={handleDateChange}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
          />
        )}
      </ThemedView>

      {/* Parking */}
      <ThemedView style={styles.formGroup}>
        <ThemedText type="defaultSemiBold">Parking Available *</ThemedText>
        <View style={getPickerStyle('parking')}>
          <Picker
            selectedValue={formData.parking}
            onValueChange={(v) => handleInputChange('parking', v)}
          >
            <Picker.Item label="Yes" value="Yes" />
            <Picker.Item label="No" value="No" />
          </Picker>
        </View>
        {fieldErrors.parking && touchedFields.has('parking') && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={16} color="#DC3545" />
            <ThemedText style={styles.errorText}>{fieldErrors.parking}</ThemedText>
          </View>
        )}
      </ThemedView>

      {/* Length */}
      <ThemedView style={styles.formGroup}>
        <ThemedText type="defaultSemiBold">Length (km) *</ThemedText>
        <TextInput
          style={getInputStyle('length')}
          value={formData.length}
          onChangeText={(v) => handleInputChange('length', v)}
          placeholder="e.g., 8.5"
          keyboardType="decimal-pad"
        />
        {fieldErrors.length && touchedFields.has('length') && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={16} color="#DC3545" />
            <ThemedText style={styles.errorText}>{fieldErrors.length}</ThemedText>
          </View>
        )}
      </ThemedView>

      {/* Difficulty */}
      <ThemedView style={styles.formGroup}>
        <ThemedText type="defaultSemiBold">Difficulty *</ThemedText>
        <View style={getPickerStyle('difficulty')}>
          <Picker
            selectedValue={formData.difficulty}
            onValueChange={(v) => handleInputChange('difficulty', v)}
          >
            <Picker.Item label="Easy" value="Easy" />
            <Picker.Item label="Medium" value="Medium" />
            <Picker.Item label="Hard" value="Hard" />
            <Picker.Item label="Expert" value="Expert" />
          </Picker>
        </View>
        {fieldErrors.difficulty && touchedFields.has('difficulty') && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={16} color="#DC3545" />
            <ThemedText style={styles.errorText}>{fieldErrors.difficulty}</ThemedText>
          </View>
        )}
      </ThemedView>

      {/* Description */}
      <ThemedView style={styles.formGroup}>
        <ThemedText type="defaultSemiBold">Description</ThemedText>
        <TextInput
          style={getInputStyle('description')}
          value={formData.description}
          onChangeText={(v) => handleInputChange('description', v)}
          placeholder="Describe your hike experience…"
          multiline
          maxLength={1000}
        />
        {fieldErrors.description && touchedFields.has('description') && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={16} color="#DC3545" />
            <ThemedText style={styles.errorText}>{fieldErrors.description}</ThemedText>
          </View>
        )}
        <ThemedText style={styles.charCount}>
          {formData.description.length}/1000 characters
        </ThemedText>
      </ThemedView>

      {/* Weather */}
      <ThemedView style={styles.formGroup}>
        <ThemedText type="defaultSemiBold">Weather Conditions</ThemedText>
        <TextInput
          style={getInputStyle('weather')}
          value={formData.weather}
          onChangeText={(v) => handleInputChange('weather', v)}
          placeholder="e.g., Sunny, Cloudy, Rainy"
          maxLength={50}
        />
        {fieldErrors.weather && touchedFields.has('weather') && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={16} color="#DC3545" />
            <ThemedText style={styles.errorText}>{fieldErrors.weather}</ThemedText>
          </View>
        )}
      </ThemedView>

      {/* Rating */}
      <ThemedView style={styles.formGroup}>
        <ThemedText type="defaultSemiBold">Rating (1-5)</ThemedText>
        <View style={getPickerStyle('rating')}>
          <Picker
            selectedValue={formData.rating}
            onValueChange={(v) => handleInputChange('rating', v)}
          >
            <Picker.Item label="Select rating" value="" />
            <Picker.Item label="★ 1" value="1" />
            <Picker.Item label="★ 2" value="2" />
            <Picker.Item label="★ 3" value="3" />
            <Picker.Item label="★ 4" value="4" />
            <Picker.Item label="★ 5" value="5" />
          </Picker>
        </View>
        {fieldErrors.rating && touchedFields.has('rating') && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={16} color="#DC3545" />
            <ThemedText style={styles.errorText}>{fieldErrors.rating}</ThemedText>
          </View>
        )}
      </ThemedView>

      {/* Companions */}
      <ThemedView style={styles.formGroup}>
        <ThemedText type="defaultSemiBold">Hiking Companions</ThemedText>
        <TextInput
          style={getInputStyle('companions')}
          value={formData.companions}
          onChangeText={(v) => handleInputChange('companions', v)}
          placeholder="e.g., John, Sarah"
          maxLength={100}
        />
        {fieldErrors.companions && touchedFields.has('companions') && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={16} color="#DC3545" />
            <ThemedText style={styles.errorText}>{fieldErrors.companions}</ThemedText>
          </View>
        )}
      </ThemedView>

      {/* Buttons */}
      <View style={styles.actionButtons}>
        {isEditing && onCancel && (
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
          >
            <ThemedText style={styles.buttonText}>Cancel</ThemedText>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, styles.submitButton, isEditing ? { flex: 1 } : {}]}
          onPress={handleSubmit}
        >
          <ThemedText style={styles.submitButtonText}>
            {isEditing ? 'Update Hike' : 'Submit Hike'}
          </ThemedText>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  formGroup: { gap: 8, marginBottom: 16 },
  textInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 50
  },
  errorInput: {
    borderColor: '#DC3545',
    backgroundColor: '#FFF5F5'
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top'
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden'
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    minHeight: 50,
    justifyContent: 'center'
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4
  },
  errorText: {
    color: '#DC3545',
    fontSize: 14
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 10
  },
  button: { 
    padding: 13, 
    borderRadius: 8, 
    alignItems: 'center', 
    flex: 1 
  },
  cancelButton: { 
    backgroundColor: '#6C757D' 
  },
  submitButton: { 
    backgroundColor: '#007AFF', 
    flex: 2 
  },
  submitButtonText: { 
    color: 'white', 
    fontWeight: '600' 
  },
  buttonText: { 
    fontSize: 15,
    color: 'white' 
  },
  confirmationContainer: {
    gap: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    backgroundColor: 'rgba(0,122,255,0.1)'
  },
  confirmationTitle: {
    textAlign: 'center',
    marginBottom: 8
  },
  confirmationDetails: {
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 6
  },
  confirmationButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8
  },
  editButton: { 
    backgroundColor: '#6C757D' 
  },
  confirmButton: { 
    backgroundColor: '#28A745' 
  },
  successContainer: {
    margin: 20,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#28A745',
    backgroundColor: 'rgba(40,167,69,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16
  },
  successTitle: { 
    textAlign: 'center', 
    marginTop: 10 
  },
  successMessage: { 
    textAlign: 'center', 
    opacity: 0.7 
  },
  okButton: { 
    backgroundColor: '#28A745' 
  }
});