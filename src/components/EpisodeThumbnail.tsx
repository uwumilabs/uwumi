import React, { memo, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Image } from '@/components/Image';
import { IoniconsIcon } from '@/components/Icons';
import { ThumbnailProgress } from './ThumbnailProgress';

interface EpisodeThumbnailProps {
  image?: string;
  /** Films leave it out */
  /** The episode's number, in a pill over the image; films leave it out */
  label?: string;
  /** Draws how much of the episode was watched */
  uniqueId?: string;
  width: number;
  height: number;
  /** Work it out with innerRadius from the container's radius and padding */
  radius: number;
  children?: ReactNode;
}

/** An episode's still with its number and how much was watched, for the episode list and Downloads */
export const EpisodeThumbnail = memo(
  ({ image, label, uniqueId, width, height, radius, children }: EpisodeThumbnailProps) => (
    <View
      className="relative items-center justify-center overflow-hidden bg-default"
      style={{ width, height, borderRadius: radius }}>
      {image ? (
        <Image source={image} style={{ position: 'absolute', width, height }} />
      ) : (
        <IoniconsIcon name="film-outline" size={Math.min(width, height) / 2.5} />
      )}
      {label && (
        <Text className="absolute left-2 bottom-2.5 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-black text-accent">
          {label}
        </Text>
      )}
      <ThumbnailProgress uniqueId={uniqueId} />
      {children}
    </View>
  ),
);
EpisodeThumbnail.displayName = 'EpisodeThumbnail';
