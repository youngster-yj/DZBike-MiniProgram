import { View, Text } from '@tarojs/components';
import { ReactNode } from 'react';

interface TimelinessToolbarProps {
  value: number;
  onChange: (index: number) => void;
  action?: ReactNode;
}

const OPTIONS = ['进行中', '已结束'];

export function TimelinessToolbar({ value, onChange, action }: TimelinessToolbarProps) {
  return (
    <View className="TimelinessToolbar-TimelinessToolbar-bar">
      <View className="TimelinessToolbar-TimelinessToolbar-tabs">
        {OPTIONS.map((label, index) => (
          <View
            key={label}
            className={`TimelinessToolbar-TimelinessToolbar-tab${value === index ? ' TimelinessToolbar-TimelinessToolbar-tabActive' : ''}`}
            onClick={() => onChange(index)}
          >
            <Text>{label}</Text>
          </View>
        ))}
      </View>
      {action ? <View className="TimelinessToolbar-TimelinessToolbar-action">{action}</View> : null}
    </View>
  );
}
