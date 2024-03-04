const info = {
  instructions: ["settings", "Export Vault"],
  extensions: ["json"],
  modelName: /bitwarden_export_\d+/g,
};

function format(data) {
  return {
    passwords: data.items.map((item) => ({
      password: item?.login?.password,
    })),
  };
}

export { info, format };
