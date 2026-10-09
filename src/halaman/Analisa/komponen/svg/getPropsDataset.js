export function getPropsDataset(dataset) {
  const propsDatasetEntries = Object.entries(dataset).map(([key, value]) => {
    return ["data-" + key, value];
  });
  return Object.fromEntries(propsDatasetEntries);
}
