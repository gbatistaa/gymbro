import { View } from 'react-native';

import { DataRow } from '@/components/ui/data-row';
import { Label } from '@/components/ui/label';
import { Numeral } from '@/components/ui/numeral';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Text } from '@/components/ui/text';

/**
 * Tela provisória de verificação do sistema visual.
 *
 * Não é o Início do produto: existe para provar, num aparelho, que tokens, régua, gutter de
 * anotação e numeral funcionam juntos. Substituída pela tela real na Fase 4.
 */
export default function HomeScreen() {
  return (
    <Screen edges={['top']} className="gap-6">
      <View className="gap-1">
        <Text type="title1">Gymbro</Text>
        <Text type="caption" color="muted">
          Sistema visual carregado. Nenhum dado real ainda.
        </Text>
      </View>

      <View className="gap-2">
        <Label>Série ativa</Label>
        <View className="flex-row items-baseline gap-1">
          <Numeral value="42,5" size="numeralXL" />
          <Text type="body" color="secondary">
            kg
          </Text>
        </View>
      </View>

      <View>
        <SectionHeader title="Semana 45" />
        <DataRow note="+2,5" value="100,0" unit="kg">
          <Text type="body">Supino reto</Text>
        </DataRow>
        <DataRow note="RPE 8" value="40,0" unit="kg">
          <Text type="body">Desenvolvimento</Text>
        </DataRow>
        <DataRow note="há 6 d" value="72,5" unit="kg" onPress={() => {}}>
          <Text type="body">Remada curvada</Text>
        </DataRow>
      </View>
    </Screen>
  );
}
