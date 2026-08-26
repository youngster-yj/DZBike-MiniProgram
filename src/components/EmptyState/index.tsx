import { View, Text } from '@tarojs/components';


interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <View className={"EmptyState-EmptyState-empty"}>
      <Text className={"EmptyState-EmptyState-title"}>{title}</Text>
      {description && <Text className={"EmptyState-EmptyState-desc"}>{description}</Text>}
    </View>
  );
}
