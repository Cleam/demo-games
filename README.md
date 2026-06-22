# 试玩游戏集合

目前打算一个项目一个目录。

- fish

## fish

项目结构

```
fish
├── assets
│   ├── images
│   │   ├── bg.png
│   │   ├── fish_11002
│   │   │   ├── eff_hit
│   │   │   │   ├── eff_11002_hurt_atk-start_00.png
│   │   │   │   ├── eff_11002_hurt_atk-start_01.png
│   │   │   │   ├── eff_11002_hurt_atk-start_02.png
│   │   │   │   ├── ……
│   │   │   │   ├── eff_11002_hurt_atk-start_09.png
│   │   │   │   └── Thumbs.db
│   │   │   ├── eff_ult
│   │   │   │   ├── eff_11002_fin_ult-start_00.png
│   │   │   │   ├── eff_11002_fin_ult-start_01.png
│   │   │   │   ├── eff_11002_fin_ult-start_02.png
│   │   │   │   ├── ……
│   │   │   │   ├── eff_11002_fin_ult-start_31.png
│   │   │   │   └── Thumbs.db
│   │   │   └── hero
│   │   │       ├── fish_11002-atk_00.png
│   │   │       ├── fish_11002-atk_01.png
│   │   │       ├── fish_11002-atk_02.png
│   │   │       ├── ……
│   │   │       ├── fish_11002-die_19.png
│   │   │       ├── fish_11002-idle_00.png
│   │   │       ├── fish_11002-idle_01.png
│   │   │       ├── ……
│   │   │       ├── fish_11002-idle_59.png
│   │   │       ├── fish_11002-move_00.png
│   │   │       ├── fish_11002-move_01.png
│   │   │       ├── fish_11002-move_02.png
│   │   │       ├── ……
│   │   │       ├── fish_11002-move_39.png
│   │   │       ├── fish_11002-ult_00.png
│   │   │       ├── fish_11002-ult_01.png
│   │   │       ├── fish_11002-ult_02.png
│   │   │       ├── ……
│   │   │       ├── fish_11002-ult_31.png
│   │   │       ├── fish_11002-ultb_00.png
│   │   │       ├── fish_11002-ultb_01.png
│   │   │       ├── fish_11002-ultb_02.png
│   │   │       ├── ……
│   │   │       ├── fish_11002-ultb_31.png
│   │   │       └── Thumbs.db
│   │   ├── fish_11003
│   │   │   ├── eff_hit
│   │   │   │   ├── eff_01_hurt-start_00.png
│   │   │   │   ├── eff_01_hurt-start_01.png
│   │   │   │   ├── eff_01_hurt-start_02.png
│   │   │   │   ├── ……
│   │   │   │   ├── eff_01_hurt-start_11.png
│   │   │   │   └── Thumbs.db
│   │   │   ├── eff_ult
│   │   │   │   ├── eff_11003_main_ult_front-start_00.png
│   │   │   │   ├── eff_11003_main_ult_front-start_01.png
│   │   │   │   ├── ……
│   │   │   │   └── eff_11003_main_ult_front-start_56.png
│   │   │   └── hero
│   │   │       ├── fish_11003-atk_00.png
│   │   │       ├── fish_11003-atk_01.png
│   │   │       ├── fish_11003-atk_02.png
│   │   │       ├── ……
│   │   │       ├── fish_11003-die_19.png
│   │   │       ├── fish_11003-idle_00.png
│   │   │       ├── fish_11003-idle_01.png
│   │   │       ├── fish_11003-idle_02.png
│   │   │       ├── ……
│   │   │       ├── fish_11003-idle_59.png
│   │   │       ├── fish_11003-move_00.png
│   │   │       ├── fish_11003-move_01.png
│   │   │       ├── fish_11003-move_02.png
│   │   │       ├── ……
│   │   │       ├── fish_11003-move_39.png
│   │   │       ├── fish_11003-ult_00.png
│   │   │       ├── fish_11003-ult_01.png
│   │   │       ├── fish_11003-ult_02.png
│   │   │       ├── ……
│   │   │       ├── fish_11003-ult_35.png
│   │   │       └── Thumbs.db
│   │   ├── fish_14104
│   │   │   ├── eff_atk
│   │   │   │   ├── eff_14104_main_atk-start_00.png
│   │   │   │   ├── eff_14104_main_atk-start_01.png
│   │   │   │   ├── eff_14104_main_atk-start_02.png
│   │   │   │   ├── ……
│   │   │   │   └── eff_14104_main_atk-start_22.png
│   │   │   ├── eff_hit
│   │   │   │   ├── eff_14104_hit-start_00.png
│   │   │   │   ├── eff_14104_hit-start_01.png
│   │   │   │   ├── ……
│   │   │   │   └── eff_14104_hit-start_16.png
│   │   │   ├── eff_ult
│   │   │   │   ├── eff_14104_main_ult-start_00.png
│   │   │   │   ├── eff_14104_main_ult-start_01.png
│   │   │   │   ├── eff_14104_main_ult-start_02.png
│   │   │   │   ├── ……
│   │   │   │   ├── eff_14104_main_ult-start_74.png
│   │   │   │   └── Thumbs.db
│   │   │   └── hero
│   │   │       ├── fish_14104-atk_00.png
│   │   │       ├── fish_14104-atk_01.png
│   │   │       ├── fish_14104-atk_02.png
│   │   │       ├── ……
│   │   │       ├── fish_14104-die_19.png
│   │   │       ├── fish_14104-idle_00.png
│   │   │       ├── fish_14104-idle_01.png
│   │   │       ├── fish_14104-idle_02.png
│   │   │       ├── ……
│   │   │       ├── fish_14104-idle_59.png
│   │   │       ├── fish_14104-move_00.png
│   │   │       ├── fish_14104-move_01.png
│   │   │       ├── fish_14104-move_02.png
│   │   │       ├── ……
│   │   │       ├── fish_14104-move_39.png
│   │   │       ├── fish_14104-ult_00.png
│   │   │       ├── fish_14104-ult_01.png
│   │   │       ├── fish_14104-ult_02.png
│   │   │       ├── ……
│   │   │       ├── fish_14104-ult_74.png
│   │   │       └── Thumbs.db
│   │   ├── fish_15101
│   │   │   ├── eff_ult
│   │   │   │   ├── eff_15101_main_ult-start_00.png
│   │   │   │   ├── eff_15101_main_ult-start_01.png
│   │   │   │   ├── eff_15101_main_ult-start_02.png
│   │   │   │   ├── ……
│   │   │   │   ├── eff_15101_main_ult-start_57.png
│   │   │   │   └── Thumbs.db
│   │   │   └── hero
│   │   │       ├── fish_15101-atk_00.png
│   │   │       ├── fish_15101-atk_01.png
│   │   │       ├── fish_15101-atk_02.png
│   │   │       ├── ……
│   │   │       ├── fish_15101-atk_22.png
│   │   │       ├── fish_15101-die_00.png
│   │   │       ├── fish_15101-die_01.png
│   │   │       ├── fish_15101-die_02.png
│   │   │       ├── ……
│   │   │       ├── fish_15101-die_19.png
│   │   │       ├── fish_15101-idle_00.png
│   │   │       ├── fish_15101-idle_01.png
│   │   │       ├── fish_15101-idle_02.png
│   │   │       ├── ……
│   │   │       ├── fish_15101-idle_29.png
│   │   │       ├── fish_15101-move_00.png
│   │   │       ├── fish_15101-move_01.png
│   │   │       ├── fish_15101-move_02.png
│   │   │       ├── ……
│   │   │       ├── fish_15101-ult_54.png
│   │   │       └── Thumbs.db
│   │   ├── fish_15102
│   │   │   ├── eff_atk
│   │   │   │   ├── eff_15102_main_atk-start_00.png
│   │   │   │   ├── eff_15102_main_atk-start_01.png
│   │   │   │   ├── eff_15102_main_atk-start_02.png
│   │   │   │   ├── ……
│   │   │   │   ├── eff_15102_main_atk-start_22.png
│   │   │   │   └── Thumbs.db
│   │   │   ├── eff_hit
│   │   │   │   ├── eff_15102_hit-start_00.png
│   │   │   │   ├── eff_15102_hit-start_01.png
│   │   │   │   ├── eff_15102_hit-start_02.png
│   │   │   │   ├── ……
│   │   │   │   └── eff_15102_hit-start_11.png
│   │   │   ├── eff_ult
│   │   │   │   ├── eff_15102_main_ult-start_00.png
│   │   │   │   ├── eff_15102_main_ult-start_01.png
│   │   │   │   ├── eff_15102_main_ult-start_02.png
│   │   │   │   ├── ……
│   │   │   │   ├── eff_15102_main_ult-start_48.png
│   │   │   │   └── Thumbs.db
│   │   │   └── hero
│   │   │       ├── fish_15102-atk_00.png
│   │   │       ├── fish_15102-atk_01.png
│   │   │       ├── fish_15102-atk_02.png
│   │   │       ├── ……
│   │   │       ├── fish_15102-atk_22.png
│   │   │       ├── fish_15102-die_00.png
│   │   │       ├── fish_15102-die_01.png
│   │   │       ├── fish_15102-die_02.png
│   │   │       ├── ……
│   │   │       ├── fish_15102-die_19.png
│   │   │       ├── fish_15102-idle_00.png
│   │   │       ├── fish_15102-idle_01.png
│   │   │       ├── fish_15102-idle_02.png
│   │   │       ├── ……
│   │   │       ├── fish_15102-idle_59.png
│   │   │       ├── fish_15102-move_00.png
│   │   │       ├── fish_15102-move_01.png
│   │   │       ├── fish_15102-move_02.png
│   │   │       ├── ……
│   │   │       ├── fish_15102-move_29.png
│   │   │       ├── fish_15102-ult_00.png
│   │   │       ├── fish_15102-ult_01.png
│   │   │       ├── fish_15102-ult_02.png
│   │   │       ├── ……
│   │   │       ├── fish_15102-ult_43.png
│   │   │       └── Thumbs.db
│   │   ├── sk.png
│   │   └── skin_fish_151011
│   │       ├── fish_151011-atk_00.png
│   │       ├── fish_151011-atk_01.png
│   │       ├── fish_151011-atk_02.png
│   │       ├── ……
│   │       ├── fish_151011-atk_22.png
│   │       ├── fish_151011-die_00.png
│   │       ├── fish_151011-die_01.png
│   │       ├── fish_151011-die_02.png
│   │       ├── ……
│   │       ├── fish_151011-die_19.png
│   │       ├── fish_151011-idle_00.png
│   │       ├── fish_151011-idle_01.png
│   │       ├── fish_151011-idle_02.png
│   │       ├── ……
│   │       ├── fish_151011-idle_29.png
│   │       ├── fish_151011-move_00.png
│   │       ├── fish_151011-move_01.png
│   │       ├── fish_151011-move_02.png
│   │       ├── ……
│   │       ├── fish_151011-move_19.png
│   │       ├── fish_151011-ult_00.png
│   │       ├── fish_151011-ult_01.png
│   │       ├── fish_151011-ult_02.png
│   │       ├── ……
│   │       ├── fish_151011-ult_54.png
│   │       └── Thumbs.db
│   ├── win.mp4
│   └── lose.mp4
├── GAME_FLOW.md
└── VIDEO_ANALYSIS.md
```
