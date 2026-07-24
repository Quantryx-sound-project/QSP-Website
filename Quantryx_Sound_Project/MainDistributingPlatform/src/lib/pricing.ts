// Pomocné funkcie pre ceny a zľavu pri zrušení predplatného.

export const formatEur = (n: number) => `${n.toFixed(2).replace(".", ",")} €`;

/**
 * Zľava pri zrušení predplatného na základe toho, koľko už zákazník zaplatil
 * v pomere k cene produktu (lifetime).
 *  - zaplatil 2× a viac  -> 50 %
 *  - zaplatil 3× a viac  -> 77 %
 *  - menej ako 2×        -> 0 % (žiadna zľava)
 * Nikdy nie je zadarmo.
 */
export const cancellationDiscount = (totalPaid: number, productPrice: number): number => {
  if (productPrice <= 0) return 0;
  const ratio = totalPaid / productPrice;
  if (ratio >= 3) return 0.77;
  if (ratio >= 2) return 0.5;
  return 0;
};
