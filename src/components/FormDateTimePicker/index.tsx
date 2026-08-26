import { View, Text, Picker } from '@tarojs/components';

interface FormDateTimePickerProps {
  label: string;
  date: string;
  time: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
}

export function FormDateTimePicker({
  label,
  date,
  time,
  onDateChange,
  onTimeChange,
}: FormDateTimePickerProps) {
  return (
    <View className="FormDateTimePicker-FormDateTimePicker-wrap">
      <Text className="FormDateTimePicker-FormDateTimePicker-label">{label}</Text>
      <View className="FormDateTimePicker-FormDateTimePicker-row">
        <Picker mode="date" value={date} onChange={(e) => onDateChange(e.detail.value)}>
          <View className="form-picker FormDateTimePicker-FormDateTimePicker-picker">
            {date || '选择日期'}
          </View>
        </Picker>
        <Picker mode="time" value={time || '08:00'} onChange={(e) => onTimeChange(e.detail.value)}>
          <View className="form-picker FormDateTimePicker-FormDateTimePicker-picker">
            {time || '选择时间'}
          </View>
        </Picker>
      </View>
    </View>
  );
}

function combineDateTime(date: string, time: string): string {
  return `${date} ${time}`;
}

export function buildTimestamp(date: string, time: string): number {
  return Math.floor(new Date(combineDateTime(date, time)).getTime() / 1000);
}

export function formatDateTimeDisplay(date: string, time: string): string {
  if (!date) return '';
  return combineDateTime(date, time || '00:00');
}
