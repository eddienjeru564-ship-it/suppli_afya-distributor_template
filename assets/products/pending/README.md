# Photos waiting for a product

These came in the same set of official pack photos (`BF_Suma_Final_Use_Images.zip`, 11 October 2026)
but the products aren't in the engine's catalogue, so the storefront can't sell or show them yet.

| File | Original file | What the pack says |
|---|---|---|
| `gymease-tea.png` | `08_Gluco_Blocer_Tea.png` | GymEase Tea: gymnema and Camellia sinensis (tea, so caffeine), 20 sachets |
| `dr-cow-calcium-milk-candy.png` | `12_Calcium_Candy.png` | Dr. Cow Calcium Milk Candy, 100 tablets |
| `dr-cow-smart-gummies.png` | `13_Smart_Gummies.png` | Dr. Cow Smart Gummies, omega-3 fish oil |
| `ntdiarr.png` | `15_NTDiarr.png` | NTDiarr pills (red bamboo), 50 pills |
| `nmn-sharp-mind.png` | `18_NMN_Sharp_Mind.png` | NMN Sharp Mind |
| `cool-roll.jpg` | `21_Cool_Roll.jpg` | Cool Roll, 10 ml |
| `dr-ts-toothpaste.jpg` | `25_Dr_Ts_Toothpaste.jpg` | Dr. Ts toothpaste |
| `olive-oil-repair-soap.png` | `27_Oliveoil_Repair_Soap.png` | Olive oil repair soap |
| `purewell.png` | `28_PureWell.png` | Purewell water purifier and filter |

To use one: add the product upstream in Suppli Afya (`src/engine/catalogue.ts`, with its traits
checked against the label), `npm run engine:sync`, move the file up a folder named by the new product
id, record its source in `../sources.json`, and run `npm run photos`.
