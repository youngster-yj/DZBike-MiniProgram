import { View, Image } from '@tarojs/components';
import { previewImages } from '@/utils/helpers';

interface ImagesGridBoxProps {
  size: number;
  images: string[];
}

function GridImg({
  url,
  all,
  className,
}: {
  url: string;
  all: string[];
  className?: string;
}) {
  return (
    <View className={className || 'ImagesGridBox-ImagesGridBox-flex'}>
      <Image
        className="ImagesGridBox-ImagesGridBox-img"
        src={url}
        mode="aspectFill"
        onClick={(e) => {
          e.stopPropagation();
          previewImages(all, url);
        }}
      />
    </View>
  );
}

function renderGrid(images: string[]) {
  const data = images.slice(0, 9);
  const img = (url: string, cls?: string) => (
    <GridImg key={url} url={url} all={images} className={cls} />
  );

  switch (data.length) {
    case 1:
      return <View className="ImagesGridBox-ImagesGridBox-show">{img(data[0])}</View>;
    case 2:
      return (
        <View className="ImagesGridBox-ImagesGridBox-show ImagesGridBox-ImagesGridBox-row">
          {img(data[0])}
          {img(data[1])}
        </View>
      );
    case 3:
      return (
        <View className="ImagesGridBox-ImagesGridBox-show ImagesGridBox-ImagesGridBox-row">
          {img(data[0])}
          <View className="ImagesGridBox-ImagesGridBox-flex ImagesGridBox-ImagesGridBox-column">
            {img(data[1])}
            {img(data[2])}
          </View>
        </View>
      );
    case 4:
      return (
        <View className="ImagesGridBox-ImagesGridBox-show ImagesGridBox-ImagesGridBox-row">
          <View className="ImagesGridBox-ImagesGridBox-flex ImagesGridBox-ImagesGridBox-column">
            {img(data[0])}
            {img(data[1])}
          </View>
          <View className="ImagesGridBox-ImagesGridBox-flex ImagesGridBox-ImagesGridBox-column">
            {img(data[2])}
            {img(data[3])}
          </View>
        </View>
      );
    case 5:
      return (
        <View className="ImagesGridBox-ImagesGridBox-show ImagesGridBox-ImagesGridBox-column">
          <View className="ImagesGridBox-ImagesGridBox-flex ImagesGridBox-ImagesGridBox-row">
            {img(data[0], 'ImagesGridBox-ImagesGridBox-flexTwo')}
            {img(data[1])}
          </View>
          <View className="ImagesGridBox-ImagesGridBox-flex ImagesGridBox-ImagesGridBox-row">
            {img(data[2])}
            {img(data[3])}
            {img(data[4])}
          </View>
        </View>
      );
    case 6:
      return (
        <View className="ImagesGridBox-ImagesGridBox-show ImagesGridBox-ImagesGridBox-column">
          <View className="ImagesGridBox-ImagesGridBox-flexTwo ImagesGridBox-ImagesGridBox-row">
            {img(data[0], 'ImagesGridBox-ImagesGridBox-flexTwo')}
            <View className="ImagesGridBox-ImagesGridBox-flex ImagesGridBox-ImagesGridBox-column">
              {img(data[1])}
              {img(data[2])}
            </View>
          </View>
          <View className="ImagesGridBox-ImagesGridBox-flex ImagesGridBox-ImagesGridBox-row">
            {img(data[3])}
            {img(data[4])}
            {img(data[5])}
          </View>
        </View>
      );
    case 7:
      return (
        <View className="ImagesGridBox-ImagesGridBox-show ImagesGridBox-ImagesGridBox-column">
          <View className="ImagesGridBox-ImagesGridBox-flex ImagesGridBox-ImagesGridBox-row">
            {img(data[0], 'ImagesGridBox-ImagesGridBox-flexTwo')}
            {img(data[1])}
          </View>
          <View className="ImagesGridBox-ImagesGridBox-flex ImagesGridBox-ImagesGridBox-row">
            {img(data[2], 'ImagesGridBox-ImagesGridBox-flexTwo')}
            {img(data[3])}
          </View>
          <View className="ImagesGridBox-ImagesGridBox-flex ImagesGridBox-ImagesGridBox-row">
            {img(data[4])}
            {img(data[5])}
            {img(data[6])}
          </View>
        </View>
      );
    case 8:
      return (
        <View className="ImagesGridBox-ImagesGridBox-show ImagesGridBox-ImagesGridBox-column">
          <View className="ImagesGridBox-ImagesGridBox-flex ImagesGridBox-ImagesGridBox-row">
            {img(data[0], 'ImagesGridBox-ImagesGridBox-flexTwo')}
            {img(data[1])}
          </View>
          <View className="ImagesGridBox-ImagesGridBox-flex ImagesGridBox-ImagesGridBox-row">
            {img(data[2])}
            {img(data[3])}
            {img(data[4])}
          </View>
          <View className="ImagesGridBox-ImagesGridBox-flex ImagesGridBox-ImagesGridBox-row">
            {img(data[5])}
            {img(data[6])}
            {img(data[7])}
          </View>
        </View>
      );
    case 9:
      return (
        <View className="ImagesGridBox-ImagesGridBox-show ImagesGridBox-ImagesGridBox-column">
          <View className="ImagesGridBox-ImagesGridBox-flex ImagesGridBox-ImagesGridBox-row">
            {img(data[0])}
            {img(data[1])}
            {img(data[2])}
          </View>
          <View className="ImagesGridBox-ImagesGridBox-flex ImagesGridBox-ImagesGridBox-row">
            {img(data[3])}
            {img(data[4])}
            {img(data[5])}
          </View>
          <View className="ImagesGridBox-ImagesGridBox-flex ImagesGridBox-ImagesGridBox-row">
            {img(data[6])}
            {img(data[7])}
            {img(data[8])}
          </View>
        </View>
      );
    default:
      return null;
  }
}

export function ImagesGridBox({ size, images }: ImagesGridBoxProps) {
  if (!images.length) return null;
  return (
    <View
      className="ImagesGridBox-ImagesGridBox-root"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      {renderGrid(images)}
    </View>
  );
}
