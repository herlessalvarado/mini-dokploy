export type CustomLabel = {
  key: string;
  value: string;
};

export function parseCustomLabels(input: string): CustomLabel[] {
  if (!input.trim()) {
    return [];
  }

  return input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf("=");

      if (separatorIndex === -1) {
        throw new Error(`Invalid label "${line}". Use key=value format.`);
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();

      if (!key || !value) {
        throw new Error(`Invalid label "${line}". Use key=value format.`);
      }

      return { key, value };
    });
}