export interface ControlSettings {
  joystickSize: 'small' | 'medium' | 'large';
  buttonSize: 'normal' | 'large';
  buttonOpacity: number; // 0.3 to 1.0
  cameraSensitivity: number; // 0.5 to 2.5
  aimSensitivity: number; // 0.5 to 2.5
  vibrationEnabled: boolean;
  soundVolume: number; // 0 to 1
  musicVolume: number; // 0 to 1
}

export const DEFAULT_CONTROL_SETTINGS: ControlSettings = {
  joystickSize: 'medium',
  buttonSize: 'normal',
  buttonOpacity: 0.85,
  cameraSensitivity: 1.0,
  aimSensitivity: 0.8,
  vibrationEnabled: true,
  soundVolume: 0.8,
  musicVolume: 0.6,
};
