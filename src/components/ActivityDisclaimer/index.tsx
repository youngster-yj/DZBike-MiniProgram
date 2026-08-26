import { View, Text, ScrollView, Button } from '@tarojs/components';

interface ActivityDisclaimerProps {
  onClose: () => void;
  onAgree: () => void;
}

export function ActivityDisclaimer({ onClose, onAgree }: ActivityDisclaimerProps) {
  return (
    <View className="activity-bike-index-modal">
      <View className="activity-bike-index-disclaimerModal">
        <Text className="activity-bike-index-modalTitle">发起活动</Text>
        <ScrollView scrollY className="activity-bike-index-disclaimerScroll">
          <View className="activity-bike-index-disclaimerSection">
            <Text className="activity-bike-index-disclaimerHeading">注意事项</Text>
            <Text className="activity-bike-index-disclaimerText">
              1. 骑友输入的名称及电话号将会加密后以 张大<Text className="activity-bike-index-disclaimerEm">(张大*)</Text>
              15508186565<Text className="activity-bike-index-disclaimerEm">(1367829****)</Text> 进行展示，为方便联系请输入真实信息
            </Text>
            <Text className="activity-bike-index-disclaimerText">
              2. 仅<Text className="activity-bike-index-disclaimerEm">活动创建者</Text>
              可根据创建时名称及电话号查看参与者完整报名信息用于活动联系(ps:请自行核对活动发布者身份)
            </Text>
            <Text className="activity-bike-index-disclaimerText">
              3. 为防止无关人员报名,报名者报名时需输入活动创建者
              <Text className="activity-bike-index-disclaimerEm">口令</Text>
              (二维码扫码会自动带入口令)
            </Text>
            <Text className="activity-bike-index-disclaimerText">
              4. 除<Text className="activity-bike-index-disclaimerEm">瑞豹</Text>达州总代与
              <Text className="activity-bike-index-disclaimerEm">喜德盛</Text>
              龙郡外滩达州旗舰店发布的官方活动外,第三方活动创建者需等待审核(可首页联系店铺加速通过)
            </Text>
            <Text className="activity-bike-index-disclaimerText">
              5. 活动自愿参加，安全责任自负，夜骑必备头盔手套，前后灯。请严格遵守交通规则
            </Text>
          </View>
          <View className="activity-bike-index-disclaimerSection">
            <Text className="activity-bike-index-disclaimerHeading">免责申明</Text>
            <Text className="activity-bike-index-disclaimerText">
              凡报名参与本次活动的车友即视为您已知晓本声明具体内容并同意声明中各条款。
            </Text>
            <Text className="activity-bike-index-disclaimerText">
              1.本活动属于非营利性质自助出行活动,当由于意外导致不可预测因素造成身体损害时，团队的发起者和同行者有义务尽力救助,但如果造成了不可逆转的损害,活动组织者和同行者亦不承担任何法律和经济责任。
            </Text>
            <Text className="activity-bike-index-disclaimerText">
              2.凡报名参加者均视为具有完全民事行为能力的人,如在活动中发生人身损害后果,团队的发起者和同行者不承担赔偿责任,由被损害人依据法律规定和本《免责条款》声明依法解决,凡报名者均视为接受本声明。
            </Text>
            <Text className="activity-bike-index-disclaimerText">
              3.本人必须遵守《中华人民共和国道路交通安全法》等国家法律法规，严格遵守交通规则，采取一切措施避免给本人或他人造成人身或财产的损失，以及避免承担法律上的责任。
            </Text>
            <Text className="activity-bike-index-disclaimerText">
              4.本人清楚活动过程中，可能因为运输及摆放停靠，意外摔车等可能造成单车损伤，本人不会对上述原因造成的单车损伤追究活动参与者和组织者的责任。
            </Text>
            <Text className="activity-bike-index-disclaimerText">
              5.该免责申明目的是为活动发起人组织者和同行者再次明确户外活动的风险,提高自律能力和抗风险能力,免除一些不必要的后果,让户外活动更安全!
            </Text>
            <Text className="activity-bike-index-disclaimerText">
              6.再次提醒,骑行有一定危险性,报名请务必佩戴头盔。
            </Text>
          </View>
        </ScrollView>
        <View className="activity-bike-index-disclaimerActions">
          <Button size="mini" onClick={onClose}>拒绝</Button>
          <Button size="mini" type="primary" className="button-primary" onClick={onAgree}>同意</Button>
        </View>
      </View>
    </View>
  );
}
