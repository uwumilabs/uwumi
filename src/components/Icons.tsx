import React from 'react';
import { withUniwind } from 'uniwind';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export type IoniconProps = React.ComponentProps<typeof Ionicons>;
export type IoniconsIconProps = IoniconProps & { className?: string };
const StyledIonicons = withUniwind(Ionicons);

// An icon is a font glyph in a Text: hidden from screen readers, it stays out of the labels of the buttons around it
const decorative = { accessible: false, importantForAccessibility: 'no', accessibilityElementsHidden: true } as const;

export const IoniconsIcon = (props: IoniconsIconProps) => (
  <StyledIonicons
    className={props.className ?? (props.color ? undefined : 'text-accent')}
    size={24}
    {...decorative}
    {...props}
  />
);

export type MaterialIconsProps = React.ComponentProps<typeof MaterialIcons>;
export type MaterialIconsIconProps = MaterialIconsProps & { className?: string };
const StyledMaterialIcons = withUniwind(MaterialIcons);

export const MaterialIconsIcon = (props: MaterialIconsIconProps) => (
  <StyledMaterialIcons
    className={props.className ?? (props.color ? undefined : 'text-accent')}
    size={24}
    {...decorative}
    {...props}
  />
);
