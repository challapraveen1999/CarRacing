import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import colors from '../helpers/colorCodes.json';
import { playEffect } from '../helpers/SoundManager';

const CustomModal = ({
  visible = false,
  title = '',
  message = '',
  icon = '🏎️',
  type = 'default', // 'default' | 'danger' | 'success' | 'warning'
  confirmText = 'OK',
  cancelText = null,
  onConfirm = () => {},
  onCancel = null,
}) => {
  if (!visible) return null;

  const handleConfirm = () => {
    playEffect('button');
    onConfirm();
  };

  const handleCancel = () => {
    playEffect('button');
    if (onCancel) onCancel();
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          borderColor: colors.danger,
          iconBg: 'rgba(255, 23, 68, 0.15)',
          buttonBg: colors.danger,
          buttonText: '#FFFFFF',
        };
      case 'success':
        return {
          borderColor: colors.success,
          iconBg: 'rgba(0, 230, 118, 0.15)',
          buttonBg: colors.success,
          buttonText: '#0D1117',
        };
      case 'warning':
        return {
          borderColor: colors.warning,
          iconBg: 'rgba(255, 214, 0, 0.15)',
          buttonBg: colors.warning,
          buttonText: '#0D1117',
        };
      default:
        return {
          borderColor: colors.secondary,
          iconBg: 'rgba(0, 229, 255, 0.12)',
          buttonBg: colors.secondary,
          buttonText: '#0D1117',
        };
    }
  };

  const typeConfig = getTypeStyles();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel || onConfirm}>
      <TouchableWithoutFeedback onPress={onCancel || onConfirm}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.card, { borderColor: typeConfig.borderColor }]}>
              {/* Icon Badge */}
              <View style={[styles.iconCircle, { backgroundColor: typeConfig.iconBg }]}>
                <Text style={styles.iconText}>{icon}</Text>
              </View>

              {/* Title */}
              <Text style={styles.title}>{title}</Text>

              {/* Message */}
              <Text style={styles.message}>{message}</Text>

              {/* Buttons Row */}
              <View style={styles.buttonRow}>
                {cancelText && (
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    activeOpacity={0.7}
                    onPress={handleCancel}>
                    <Text style={styles.cancelText}>{cancelText}</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.confirmButton,
                    { backgroundColor: typeConfig.buttonBg },
                  ]}
                  activeOpacity={0.8}
                  onPress={handleConfirm}>
                  <Text style={[styles.confirmText, { color: typeConfig.buttonText }]}>
                    {confirmText}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 17, 23, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.backgroundCard,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 22,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.backgroundSurface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 10,
  },
  confirmButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
});

export default CustomModal;

