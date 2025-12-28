import React from 'react';
import { withUniwind } from 'uniwind';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export type IoniconProps = React.ComponentProps<typeof Ionicons>;
export type IoniconsIconProps =
  | (IoniconProps & { className?: string })
  | { props: IoniconProps & { className?: string } };
const CustomIonicons = withUniwind(Ionicons);

export const IoniconsIcon = (props: IoniconsIconProps) => {
  const innerProps = 'props' in props ? props.props : props;
  const defaultClassName = innerProps.className ?? (innerProps.color ? undefined : 'text-accent');

  return <CustomIonicons className={defaultClassName} size={24} {...innerProps} />;
};

export type MaterialIconsProps = React.ComponentProps<typeof MaterialIcons>;
export type MaterialIconsIconProps =
  | (MaterialIconsProps & { className?: string })
  | { props: MaterialIconsProps & { className?: string } };
const CustomMaterialIcons = withUniwind(MaterialIcons);

export const MaterialIconsIcon = (props: MaterialIconsIconProps) => {
  const innerProps = 'props' in props ? props.props : props;
  const defaultClassName = innerProps.className ?? (innerProps.color ? undefined : 'text-accent');

  return <CustomMaterialIcons className={defaultClassName} size={24} {...innerProps} />;
};
