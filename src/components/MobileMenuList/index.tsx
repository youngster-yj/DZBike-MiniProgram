import { View, Text, Image } from '@tarojs/components';
import { useState } from 'react';
import { MenuItemProps } from '@/data/navConfig';
import shopIcon from '@/assets/menu/shop.png';
import giftIcon from '@/assets/menu/gift.png';
import shoppingIcon from '@/assets/menu/shopping.png';
import cameraIcon from '@/assets/menu/camera.png';
import lightningIcon from '@/assets/menu/lightning.png';
import arrowRightIcon from '@/assets/menu/arrow-right.png';
import arrowDownIcon from '@/assets/menu/arrow-down.png';

export interface MobileMenuListProps {
  items: MenuItemProps[];
  onSelect: (key: string) => void;
  variant?: 'goods' | 'activity';
}

function getIconSrc(item: MenuItemProps, variant: 'goods' | 'activity') {
  if (variant === 'activity') {
    if (item.key === 'bike') return lightningIcon;
    if (item.key === 'shop') return giftIcon;
    if (item.key === 'collect') return cameraIcon;
    return lightningIcon;
  }
  if (item.key === 'babyBike') return giftIcon;
  if (item.key === 'equip') return shoppingIcon;
  return shopIcon;
}

export function MobileMenuList({ items, onSelect, variant = 'goods' }: MobileMenuListProps) {
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <View className="MobileMenuList-MobileMenuList-list">
      {items.map((item) => {
        if (item.children?.length) {
          const expanded = !!expandedKeys[item.key];
          return (
            <View key={item.key} className="MobileMenuList-MobileMenuList-group">
              <View
                className={`MobileMenuList-MobileMenuList-row MobileMenuList-MobileMenuList-rowExpandable${expanded ? ' MobileMenuList-MobileMenuList-rowExpanded' : ''}`}
                onClick={() => toggleExpand(item.key)}
              >
                <View className="MobileMenuList-MobileMenuList-iconBox">
                  <Image className="MobileMenuList-MobileMenuList-icon" src={getIconSrc(item, variant)} mode="aspectFit" />
                </View>
                <View className="MobileMenuList-MobileMenuList-text">
                  <Text className="MobileMenuList-MobileMenuList-label">{item.label}</Text>
                  {item.desc && (
                    <Text className="MobileMenuList-MobileMenuList-desc">{item.desc}</Text>
                  )}
                </View>
                <View className="MobileMenuList-MobileMenuList-trailing">
                  <Text className="MobileMenuList-MobileMenuList-count">共 {item.children.length} 项</Text>
                  <Image
                    className={`MobileMenuList-MobileMenuList-arrow${expanded ? ' MobileMenuList-MobileMenuList-arrowUp' : ''}`}
                    src={arrowDownIcon}
                    mode="aspectFit"
                  />
                </View>
              </View>
              {expanded && item.children.map((child) => (
                <View
                  key={child.key}
                  className="MobileMenuList-MobileMenuList-row MobileMenuList-MobileMenuList-rowChild"
                  onClick={() => onSelect(child.key)}
                >
                  <View className="MobileMenuList-MobileMenuList-iconBox MobileMenuList-MobileMenuList-iconBoxChild">
                    <Image className="MobileMenuList-MobileMenuList-icon" src={shopIcon} mode="aspectFit" />
                  </View>
                  <Text className="MobileMenuList-MobileMenuList-label">{child.label}</Text>
                  <Image className="MobileMenuList-MobileMenuList-arrow" src={arrowRightIcon} mode="aspectFit" />
                </View>
              ))}
            </View>
          );
        }

        return (
          <View
            key={item.key}
            className="MobileMenuList-MobileMenuList-row"
            onClick={() => onSelect(item.key)}
          >
            <View className="MobileMenuList-MobileMenuList-iconBox">
              <Image className="MobileMenuList-MobileMenuList-icon" src={getIconSrc(item, variant)} mode="aspectFit" />
            </View>
            <View className="MobileMenuList-MobileMenuList-text">
              <Text className="MobileMenuList-MobileMenuList-label">{item.label}</Text>
              {item.desc && (
                <Text className="MobileMenuList-MobileMenuList-desc">{item.desc}</Text>
              )}
            </View>
            <Image className="MobileMenuList-MobileMenuList-arrow" src={arrowRightIcon} mode="aspectFit" />
          </View>
        );
      })}
    </View>
  );
}
