import { FunctionComponent } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useFpsMetric } from '@/hooks/useFpsMetric'

const styles = StyleSheet.create({
  text: {
    color: 'white',
  },
  container: {
    backgroundColor: 'grey',
    padding: 5,
    borderRadius: 5,
  },
})

export const FpsCounter: FunctionComponent = () => {
  const { fps, average } = useFpsMetric()
  return (
    <View
      pointerEvents={'none'}
      style={styles.container}
    >
      <Text style={styles.text}>Current FPS: {fps}</Text>
      <Text style={styles.text}>Average FPS: {average.toFixed(2)}</Text>
    </View>
  )
}
