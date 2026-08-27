import { View, Text, Input, Button } from '@tarojs/components';
import { useState } from 'react';
import { judgeActivityKey } from '@/services/api/activity';
import { showError } from '@/utils/helpers';
import { ApiError } from '@/services/request';

interface ShareKeyGateProps {
  activityId: string;
  onPass: (key: string) => void;
  onClose: () => void;
}

export function ShareKeyGate({ activityId, onPass, onClose }: ShareKeyGateProps) {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!key.trim()) return showError('请输入口令');
    setLoading(true);
    try {
      const res = await judgeActivityKey({ activityId, key: key.trim() });
      if (res.ok) {
        onPass(key.trim());
      } else {
        showError(res.reason || '口令错误');
      }
    } catch (error) {
      if (error instanceof ApiError && error.displayed) return;
      showError(error instanceof Error ? error.message : '验证失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="share-key-gate-modal">
      <View className="share-key-gate-body">
        <Text className="share-key-gate-title">*口令</Text>
        <Input
          className="form-input"
          placeholder="请输入入口令"
          value={key}
          onInput={(e) => setKey(e.detail.value)}
        />
        <Text className="share-key-gate-desc">用于校验参与者身份</Text>
        <View className="share-key-gate-actions">
          <Button size="mini" onClick={onClose}>取消</Button>
          <Button
            size="mini"
            type="primary"
            className="button-primary"
            loading={loading}
            onClick={onSubmit}
          >
            提交
          </Button>
        </View>
      </View>
    </View>
  );
}
