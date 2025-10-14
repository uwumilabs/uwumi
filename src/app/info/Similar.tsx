import { View } from 'tamagui';
import React from 'react';
import { MediaType, MetaProvider } from '@/constants/types';
import { CardList } from '@/components';
import { IAnimeInfo, IMovieInfo } from 'react-native-consumet';

const Similar = ({
  data,
  mediaType,
  metaProvider,
}: {
  data?: IAnimeInfo | IMovieInfo;
  mediaType: MediaType;
  metaProvider: MetaProvider;
}) => {
  return (
    <View height="100%">
      {/* @ts-ignore */}
      <CardList staticData={data?.recommendations} mediaType={mediaType} metaProvider={metaProvider} />
    </View>
  );
};

export default Similar;
