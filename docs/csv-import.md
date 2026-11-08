# CSV import

You can add many cards to your collection at one time with a CSV file. Use **Import CSV** in the collection view.

## File format

The first line of the file must be a header. The order of the columns is not important. Names of columns are not case sensitive.

| Column | Required | Description |
| --- | --- | --- |
| `set` | Yes* | Scryfall set code, for example `lea`. |
| `collector_number` | Yes* | Collector number of the printing, for example `232` or `123a`. |
| `quantity` | Yes | Whole number from 1 to 99999. |
| `language` | No | Scryfall language code, for example `en` or `ja`. The default is `en`. |
| `finish` | No | `nonfoil`, `foil` or `etched`. The default is `nonfoil`. |
| `foil` | No | `true` or `false`. Use it if the file has no `finish` column. |
| `etched` | No | `true` or `false`. Use it if the file has no `finish` column. |
| `scryfall_id` | No | Scryfall card ID. If a row has this value, the app does not use `set` and `collector_number` for that row. |

\* A row with a `scryfall_id` can leave `set` and `collector_number` empty.

The values `true`, `1`, `yes` and `y` mean true. The values `false`, `0`, `no`, `n` and an empty value mean false. A row cannot be foil and etched.

Example:

```csv
set,collector_number,quantity,language,finish
lea,232,1,en,nonfoil
neo,1,2,ja,foil
```

## Limits

- The file can have 5,000 rows at most.
- The file can be 5 MB at most.

## How the import works

1. The app reads the file and checks each row.
2. The app finds each printing. It looks in its own database first. Then it asks Scryfall for the printings that it does not have. A progress bar shows this work.
3. The app shows a preview. For each card, it shows the quantity you have now and the quantity after the import. A card that is not in your collection shows **New**.
4. When you confirm, the app adds the cards.

If two rows in the file point to the same printing and finish, the app adds their quantities together.

A row with an error does not stop the import. The app skips the row and shows the line number and the reason in the preview and in the summary.

## Importing the same file again

The import **adds** to the quantities in your collection. It does not set them. If you import the same file two times, the quantities go up two times.
