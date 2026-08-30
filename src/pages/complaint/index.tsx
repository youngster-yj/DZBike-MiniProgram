import { View, Text, Input, Textarea, Button, Picker } from '@tarojs/components';
import { useMemo, useState } from 'react';
import { getVisibleStoreAddressDetailSync } from '@/services/platformConfig';
import { submitComplaint } from '@/services/api/complaint';
import { StoreAddressCard } from '@/components/StoreAddressCard';
import { AnimatedModal } from '@/components/AnimatedModal';
import { judgeName, judgePhone, showSuccess, showError } from '@/utils/helpers';
import { getOrCreateDeviceId } from '@/utils/deviceId';
import { usePlatformConfigVersion } from '@/store/platformConfigStore';
import { hasWxIdentity, refreshWxProfile } from '@/utils/wxProfile';


export default function ComplaintPage() {
  const configVersion = usePlatformConfigVersion();
  const stores = useMemo(
    () => getVisibleStoreAddressDetailSync(),
    [configVersion],
  );

  const shopOptions = useMemo(
    () => ['所有门店', ...stores.map((s) => `${s.title} ${s.subTitle}`)],
    [stores],
  );
  const shopValues = useMemo(
    () => ['all', ...stores.map((s) => s.shop)],
    [stores],
  );

  const [shopIndex, setShopIndex] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', content: '' });
  const [submitting, setSubmitting] = useState(false);

  const openForm = async () => {
    try {
      const profile = await refreshWxProfile();
      if (hasWxIdentity(profile)) {
        setForm((f) => ({
          ...f,
          name: profile!.nickName,
          phone: profile!.phone,
        }));
      }
    } catch {
      /* ignore */
    }
    setShowForm(true);
  };

  const onSubmit = async () => {
    const nameErr = judgeName(form.name);
    const phoneErr = judgePhone(form.phone);
    if (nameErr !== true) return showError(String(nameErr));
    if (phoneErr !== true) return showError(String(phoneErr));
    if (!form.content.trim()) return showError('投诉内容不能为空');

    setSubmitting(true);
    try {
      const res = await submitComplaint({
        shop: shopValues[shopIndex],
        name: form.name,
        phone: form.phone,
        content: form.content,
        deviceId: getOrCreateDeviceId(),
      });
      if (res.ok) {
        showSuccess('投诉成功');
        setShowForm(false);
        setForm({ name: '', phone: '', content: '' });
      }
    } catch (e) {
      showError(e instanceof Error ? e.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="complaint-index-page">
      <View className="complaint-index-intro">
        <Text className="complaint-index-h1">投诉专栏</Text>
        <Text className="complaint-index-p">尊敬的顾客朋友：</Text>
        <Text className="complaint-index-p">您好！我是达州自行车俱乐部的管理小程</Text>
        <Text className="complaint-index-p">
          首先诚挚地向您致歉，让您在这次消费中遇到不愉快的体验，我们深感愧疚
        </Text>
        <Text className="complaint-index-p">
          达州自行车俱乐部从创立开始以顾客体验为核心，满分售后为目的，因此旗下所有店铺皆为自营
        </Text>
        <Text className="complaint-index-p">
          如您遇到任何相关问题，可在此页面投诉，我将严格保护客户隐私并尽快给予您答复
        </Text>
        <Text className="complaint-index-p">对于核实存在服务问题的门店，我们将采取：</Text>
        <Text className="complaint-index-p">1.店长约谈整改</Text>
        <Text className="complaint-index-p">2.当月绩效扣减</Text>
        <Text className="complaint-index-p">3.赠送客户温馨小礼</Text>
        <Text className="complaint-index-p">
          衷心感谢您选择达州自行车俱乐部，您的监督是我们进步的动力。期待能用更好的服务与您再续"骑"缘！
        </Text>

        <Text className="complaint-index-sectionTitle">自营店铺列表</Text>
        <View className="complaint-index-storeList">
          {stores.map((info) => (
            <StoreAddressCard key={info.shop} info={info} />
          ))}
        </View>
      </View>

      <View className="complaint-index-footer">
        <Button className="complaint-index-complaintBtn button-primary" type="primary" onClick={openForm}>
          发起投诉
        </Button>
      </View>

      <AnimatedModal
        visible={showForm}
        onClose={() => setShowForm(false)}
        maskClassName="complaint-index-modal"
        bodyClassName="complaint-index-modalBody"
      >
        <Text className="complaint-index-modalTitle">发起投诉</Text>
        <Picker
          mode="selector"
          range={shopOptions}
          value={shopIndex}
          onChange={(e) => setShopIndex(Number(e.detail.value))}
        >
          <View className="complaint-index-picker form-picker">{shopOptions[shopIndex]}</View>
        </Picker>
        <Input
          className="form-input"
          placeholder="姓名或昵称"
          value={form.name}
          onInput={(e) => setForm({ ...form, name: e.detail.value })}
        />
        <Input
          className="form-input"
          placeholder="电话号"
          type="number"
          value={form.phone}
          onInput={(e) => setForm({ ...form, phone: e.detail.value })}
        />
        <Textarea
          className="form-textarea"
          placeholder="投诉内容：服务态度、店铺违规、价格问题等"
          maxlength={200}
          value={form.content}
          onInput={(e) => setForm({ ...form, content: e.detail.value })}
        />
        <View className="complaint-index-modalActions">
          <Button size="mini" onClick={() => setShowForm(false)}>取消</Button>
          <Button size="mini" type="primary" className="button-primary" loading={submitting} onClick={onSubmit}>
            提交
          </Button>
        </View>
      </AnimatedModal>
    </View>
  );
}
