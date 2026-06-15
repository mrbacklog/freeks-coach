// F7: In PHV-venster is weekvolume plyometrie maximaal 60% van normaalvolume.
// Gooit een Error als de constraint wordt geschonden — nooit stilzwijgend negeren.
export function assertPhvCap(phvVensterActief: boolean, plyoVolumeModifier: number): void {
  if (!phvVensterActief) return;
  if (plyoVolumeModifier > 0.6) {
    throw new Error(
      `F7: PHV-venster actief maar plyoVolumeModifier (${plyoVolumeModifier.toFixed(1)}) > 0.6 — veiligheidsgrens overschreden`,
    );
  }
}
