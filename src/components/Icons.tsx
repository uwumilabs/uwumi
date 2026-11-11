import React from 'react';
import { withUniwind } from 'uniwind';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export type IoniconProps = React.ComponentProps<typeof Ionicons>;
export type IoniconsIconProps = IoniconProps & { className?: string };
const StyledIonicons = withUniwind(Ionicons);

export const IoniconsIcon = (props: IoniconsIconProps) => (
  <StyledIonicons className={props.className ?? (props.color ? undefined : 'text-accent')} size={24} {...props} />
);

export type MaterialIconsProps = React.ComponentProps<typeof MaterialIcons>;
export type MaterialIconsIconProps = MaterialIconsProps & { className?: string };
const StyledMaterialIcons = withUniwind(MaterialIcons);

export const MaterialIconsIcon = (props: MaterialIconsIconProps) => (
  <StyledMaterialIcons className={props.className ?? (props.color ? undefined : 'text-accent')} size={24} {...props} />
);
