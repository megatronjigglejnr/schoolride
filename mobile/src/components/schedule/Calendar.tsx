// The month calendar (buildCalendar in the prototype). Today is ringed in ink, the selected day is the one
// marigold mark on the screen, and exam days carry a dot. Each day is a button that names itself in full.
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Press } from '@/components/Press';
import type { ExamDays } from '@/data/types';
import { MONTHS, dateKey, dayLabel, monthGrid } from '@/lib/calendar';
import { alpha, color, rgb } from '@/theme/tokens';
import { font } from '@/theme/type';
import { text } from '@/theme/text';

const INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type Props = {
  year: number;
  month: number;
  selected: string;
  today: string;
  exams: ExamDays;
  onSelect: (key: string) => void;
  onShift: (delta: number) => void;
};

export function Calendar({ year, month, selected, today, exams, onSelect, onShift }: Props) {
  const { leading, days } = monthGrid(year, month);
  const cells: (number | null)[] = [...Array(leading).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Press
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          onPress={() => onShift(-1)}
          size={{ width: 32, height: 32 }}
          style={styles.nav}>
          <Icon name="chevronLeft" size={14} strokeWidth={2.4} />
        </Press>
        <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={text.monthLabel}>
          {MONTHS[month]} {year}
        </Text>
        <Press
          accessibilityRole="button"
          accessibilityLabel="Next month"
          onPress={() => onShift(1)}
          size={{ width: 32, height: 32 }}
          style={styles.nav}>
          <Icon name="chevronRight" size={14} strokeWidth={2.4} />
        </Press>
      </View>

      <View style={styles.week} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {INITIALS.map((d, i) => (
          <Text key={i} style={styles.initial}>
            {d}
          </Text>
        ))}
      </View>

      {weeks.map((week, w) => (
        <View key={w} style={styles.week}>
          {week.map((d, i) => {
            if (d === null) return <View key={i} style={styles.cell} />;
            const key = dateKey(year, month, d);
            const isToday = key === today;
            const isSelected = key === selected;
            const exam = !!exams[key];
            return (
              <Press
                key={i}
                accessibilityRole="button"
                accessibilityLabel={dayLabel(key) + (exam ? ', exam day' : '') + (isToday ? ', today' : '')}
                accessibilityState={{ selected: isSelected }}
                onPress={() => onSelect(key)}
                containerStyle={styles.cell}
                style={[styles.day, isToday && styles.today, isSelected && styles.selected]}>
                <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{d}</Text>
                <View style={[styles.dot, !exam && styles.dotOff]} />
              </Press>
            );
          })}
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { paddingTop: 16, paddingHorizontal: 14, paddingBottom: 14, marginBottom: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2, paddingBottom: 10 },
  nav: { width: 32, height: 32, borderRadius: 9, backgroundColor: color.surfaceFlat, alignItems: 'center', justifyContent: 'center' },
  week: { flexDirection: 'row', gap: 2, marginBottom: 2 },
  initial: { flex: 1, textAlign: 'center', ...font(800), fontSize: 12, color: color.muted, marginBottom: 4 },
  cell: { flex: 1, aspectRatio: 1 },
  day: { flex: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  today: { borderWidth: 2, borderColor: color.ink },
  selected: { backgroundColor: color.accent, boxShadow: `0 6px 14px -8px ${alpha(rgb.ink, 0.45)}` },
  dayText: { ...font(700), fontSize: 14, color: color.ink, fontVariant: ['tabular-nums'] },
  dayTextSelected: { ...font(900) },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: color.ink, marginTop: 2 },
  // Days without an exam keep the dot's space, so every number sits on the same line.
  dotOff: { opacity: 0 },
});
