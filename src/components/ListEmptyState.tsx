import React, { ReactNode } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, cn } from 'heroui-native';
import { Button } from './Button';
import type { Provider } from '@/constants/provider';
import { useCurrentTheme, usePureBlackBackground } from '@/hooks';
import { IoniconProps, IoniconsIcon } from './Icons';
import { HUXStack, HUYStack } from './ui-primitives';

interface ListEmptyStateProps {
  icon: IoniconProps['name'];
  title: string;
  description?: string;
  detail?: string;
  children?: ReactNode;
}

export const ListEmptyState = ({ icon, title, description, detail, children }: ListEmptyStateProps) => {
  const pureBlackBackground = usePureBlackBackground((state) => state.pureBlackBackground);
  const currentTheme = useCurrentTheme();

  return (
    <Card className={cn('mx-4 mt-6 bg-background', pureBlackBackground && 'bg-black')}>
      <HUYStack className="items-center gap-3 px-6 py-8">
        <IoniconsIcon name={icon} size={32} color={currentTheme?.foreground} />
        <HUYStack className="items-center gap-1">
          <Text className="text-center text-base font-semibold text-foreground">{title}</Text>
          {!!description && <Text className="text-center text-sm text-foreground/70">{description}</Text>}
          {!!detail && (
            <Text className="text-center text-xs text-foreground/50" numberOfLines={2}>
              {detail}
            </Text>
          )}
        </HUYStack>
        {children && <HUXStack className="flex-wrap justify-center gap-2">{children}</HUXStack>}
      </HUYStack>
    </Card>
  );
};

// "Error fetching episodes: Error: [AniKoto] Network Error" -> "[AniKoto] Network Error"
const errorDetail = (error: Error) => error.message.replace(/^(Error fetching \w+: )?(Error: )?/, '');

interface ProviderEmptyStateProps {
  /** Installed providers for this media type */
  providers: Provider[];
  provider: string;
  error: Error | null;
  onRetry: () => void;
  onProviderChange: (value: string) => void;
  itemsLabel: string;
}

/** Why a provider-backed list is empty: nothing installed, a failed fetch, or a provider with no results. */
export const ProviderEmptyState = ({
  providers,
  provider,
  error,
  onRetry,
  onProviderChange,
  itemsLabel,
}: ProviderEmptyStateProps) => {
  const router = useRouter();

  if (providers.length === 0) {
    return (
      <ListEmptyState
        icon="extension-puzzle-outline"
        title="No extensions installed"
        description={`Install an extension to load ${itemsLabel}.`}>
        <Button size="sm" onPress={() => router.push('/(settings)/extensions')}>
          <Button.Label>Get extensions</Button.Label>
        </Button>
      </ListEmptyState>
    );
  }

  const providerName = providers.find(({ value }) => value === provider)?.name ?? provider;
  const alternatives = providers.filter(({ value }) => value !== provider).slice(0, 2);

  return (
    <ListEmptyState
      icon={error ? 'cloud-offline-outline' : 'file-tray-outline'}
      title={error ? `Couldn't load ${itemsLabel}` : `No ${itemsLabel} found`}
      description={
        error
          ? `${providerName} didn't respond. Try again or switch provider.`
          : `${providerName} has no ${itemsLabel} for this title.`
      }
      detail={error ? errorDetail(error) : undefined}>
      {error && (
        <Button size="sm" onPress={onRetry}>
          <Button.Label>Retry</Button.Label>
        </Button>
      )}
      {alternatives.map(({ name, value }) => (
        <Button key={value} size="sm" variant="secondary" onPress={() => onProviderChange(value)}>
          <Button.Label>{`Try ${name}`}</Button.Label>
        </Button>
      ))}
    </ListEmptyState>
  );
};

export default ListEmptyState;
