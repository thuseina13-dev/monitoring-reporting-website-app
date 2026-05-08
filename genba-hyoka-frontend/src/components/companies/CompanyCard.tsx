import React, { useState } from 'react';
import { YStack, XStack, Text, View, Button, Image } from 'tamagui';
import { ChevronDown, ChevronUp, MapPin, Mail, Phone, Pencil, Trash2, Users } from '@tamagui/lucide-icons';
import { COLORS } from '../../constants/theme';

export interface CompanyCardProps {
  id: string;
  name: string;
  address: string;
  logo?: string;
  email?: string;
  phone?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ id, name, address, logo, email, phone, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <YStack
      backgroundColor="white"
      borderRadius={12}
      borderWidth={1.5}
      borderColor={isExpanded ? COLORS.primary : COLORS.borderLight}
      overflow="hidden"
    >
      <XStack padding="$4" alignItems="center" justifyContent="space-between" onPress={() => setIsExpanded(!isExpanded)}>
        <XStack gap="$3" flex={1} alignItems="center">
          <View
            width={55}
            height={55}
            borderRadius={27.5}
            backgroundColor="#F8F9FA"
            alignItems="center"
            justifyContent="center"
            overflow="hidden"
            borderWidth={1}
            borderColor="#E9ECEF"
          >
            {logo && typeof logo === 'string' && logo.trim().length > 0 ? (
              <Image source={{ uri: logo }} width="100%" height="100%" />
            ) : (
              <XStack alignItems="center" justifyContent="center" flex={1}>
                <Users size={26} color={COLORS.primary} />
              </XStack>
            )}
          </View>

          <YStack flex={1}>
            <Text fontSize={17} fontWeight="700" color={COLORS.textMain} numberOfLines={1}>
              {name}
            </Text>
            <Text fontSize={13} color={COLORS.textSecondary} numberOfLines={1}>
              {address}
            </Text>
          </YStack>
        </XStack>

        {isExpanded ? (
          <ChevronUp size={22} color={COLORS.textSecondary} />
        ) : (
          <ChevronDown size={22} color={COLORS.textSecondary} />
        )}
      </XStack>

      {isExpanded && (
        <YStack paddingHorizontal="$4" paddingBottom="$4" gap="$4">
          <YStack gap="$2.5" paddingTop="$3" borderTopWidth={1} borderTopColor="#F8F9FA">
            {email && (
              <XStack alignItems="center" gap="$3">
                <Mail size={18} color={COLORS.textSecondary} />
                <Text fontSize={14} color={COLORS.textMain}>{email}</Text>
              </XStack>
            )}
            {phone && (
              <XStack alignItems="center" gap="$3">
                <Phone size={18} color={COLORS.textSecondary} />
                <Text fontSize={14} color={COLORS.textMain}>{phone}</Text>
              </XStack>
            )}
            <XStack alignItems="flex-start" gap="$3">
              <MapPin size={18} color={COLORS.textSecondary} marginTop={2} />
              <Text fontSize={14} color={COLORS.textMain} flex={1} lineHeight={20}>
                {address}
              </Text>
            </XStack>
          </YStack>

          <XStack justifyContent="space-between" alignItems="center" paddingTop="$2" gap="$2">
            <XStack gap="$2" flex={1}>
              <Button
                backgroundColor="white"
                borderWidth={1}
                borderColor={COLORS.primary}
                height={40}
                paddingHorizontal="$3"
                pressStyle={{ backgroundColor: '#2ECC711A' }}
                icon={<Users size={16} color={COLORS.primary} />}
              >
                <Text fontSize={13} fontWeight="700" color={COLORS.primary}>Lihat Daftar User</Text>
              </Button>
              <Button
                backgroundColor="white"
                borderWidth={1}
                borderColor={COLORS.borderLight}
                height={40}
                paddingHorizontal="$4"
                pressStyle={{ backgroundColor: '#F8F9FA' }}
                onPress={() => onEdit?.(id)}
              >
                <Text fontSize={13} fontWeight="700" color={COLORS.textMain}>Edit</Text>
              </Button>
            </XStack>
            
            <Button
              size="$3.5"
              circular
              backgroundColor="transparent"
              borderWidth={1}
              borderColor="#E74C3C"
              icon={<Trash2 size={18} color="#E74C3C" />}
              pressStyle={{ backgroundColor: '#E74C3C1A' }}
              onPress={() => onDelete?.(id)}
            />
          </XStack>
        </YStack>
      )}
    </YStack>
  );
};

export default CompanyCard;
