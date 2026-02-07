/**
 * Expo Config Plugin: Tune Android build for CI runners
 *
 * Problems solved:
 * 1. Default MaxMetaspaceSize (512m) causes OOM during lint analysis
 * 2. Full parallelism + large heap kills runners with limited RAM
 *
 * Strategy: moderate heap, larger metaspace, limit workers, no daemon.
 */

const { withGradleProperties } = require('@expo/config-plugins');

function setProperty(props, key, value) {
  const idx = props.findIndex(
    (item) => item.type === 'property' && item.key === key
  );
  if (idx >= 0) {
    props[idx].value = value;
  } else {
    props.push({ type: 'property', key, value });
  }
}

module.exports = function withAndroidBuildMemory(config) {
  return withGradleProperties(config, (config) => {
    const props = config.modResults;

    // Moderate heap (2GB) + larger metaspace (768m) = ~2.75GB total JVM
    setProperty(props, 'org.gradle.jvmargs', '-Xmx2048m -XX:MaxMetaspaceSize=768m');

    // Limit parallelism to reduce peak memory usage
    setProperty(props, 'org.gradle.workers.max', '2');

    // Disable daemon to avoid long-lived JVM eating memory
    setProperty(props, 'org.gradle.daemon', 'false');

    return config;
  });
};
