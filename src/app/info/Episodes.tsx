import { EpisodeList } from '@/components';
import { MediaType } from '@/constants/types';
import { useLocalSearchParams } from 'expo-router';
import { MediaFormat, TvType } from 'react-native-consumet';
import { View } from 'react-native';

const Episodes = () => {
  const { mediaType, provider, id, type } = useLocalSearchParams<{
    mediaType: MediaType;
    provider: string;
    type?: MediaFormat | TvType;
    id: string;
  }>();
  return (
    <View className="h-full">
      <EpisodeList mediaType={mediaType} provider={provider} id={id} type={type} swipeable />
    </View>
  );
};

export default Episodes;
