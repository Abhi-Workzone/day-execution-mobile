import React from 'react';
import { TextInput, StyleSheet, ViewStyle, TextStyle } from 'react-native';

const Input = ({ 
  placeholder, 
  value, 
  onChangeText, 
  style,
  keyboardType = 'default',
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  ...props 
}) => {
  return (
    <TextInput
      style={[
        styles.input,
        multiline === true ? styles.multilineInput : null,
        style
      ]}
      placeholder={placeholder}
      placeholderTextColor="#9CA3AF"
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry === true}
      multiline={multiline === true}
      numberOfLines={typeof numberOfLines === 'number' ? numberOfLines : 1}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
});

export default Input;
