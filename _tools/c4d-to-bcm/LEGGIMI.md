# c4d-to-bcm

Converte il modello Cinema 4D dell'auto (`Opel Astra.c4d`, R14) nel formato compatto usato dal simulatore
(`borgo-car/assets/js/car-model.js`: geometria quantizzata, gzip + base64, decodificata nel browser con `DecompressionStream`).

- `c4dparse.mjs`: lettore minimale del formato C4D per questo file (punti, poligoni, selezioni, tag texture).
- `convert.mjs`: orienta e scala l'auto (muso +X, metri), raggruppa i materiali, separa fari e fanali,
  rimuove loghi e scritte, semplifica con meshoptimizer (~127k triangoli) e separa i bordi vivi.

Uso (servono `node` e il pacchetto npm `meshoptimizer`):

    npm i meshoptimizer
    node convert.mjs "Opel Astra.c4d" ../../borgo-car/assets/js/car-model.js

Il file .c4d non è nel repository: ha licenza Free3D per solo uso personale (vedi `borgo-car/assets/CREDITS.md`).
