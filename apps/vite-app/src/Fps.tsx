import { FunctionComponent } from "react";
import { useFpsMetric } from "./useFpsMetric";

const styles = StyleSheet.create({
  text: {
    color: "white",
  },
  container: {
    backgroundColor: "grey",
    padding: 5,
    borderRadius: 5,
  },
});

export const FpsCounter: FunctionComponent = () => {
  const { fps, average } = useFpsMetric();
  return (
    <div pointerEvents={"none"} style={styles.container}>
      <div style={styles.text}>Current FPS: {fps}</div>
      <div style={styles.text}>Average FPS: {average.toFixed(2)}</div>
    </div>
  );
};
