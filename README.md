# DatPartoutExplorer
Parses the PARTOUT(4.0)RESOURCE file format used by Maxis/Cinematronics in Full Tilt Pinball and displays the contents.

I started this project in June 2015. I used this [REWiki article](https://web.archive.org/web/20180221135500/http://rewiki.regengedanken.de:80/wiki/.DAT_(PARTOUT)) and [it's discussion page](https://web.archive.org/web/20180122030304/http://rewiki.regengedanken.de/wiki/Talk:.DAT_(PARTOUT)) for reference and made this [010 Editor Template](https://gist.github.com/belaw/01f22c91a7c073004096f34291943f6f) to figure out the rest of the file format.

## Usage Instructions

1. Open the web app - https://belaw.github.io/DatPartoutExplorer
2. Choose which page you want
    - [File Structure Viewer](https://belaw.github.io/DatPartoutExplorer/index.html)
    - [3D Model Reconstruction](https://belaw.github.io/DatPartoutExplorer/3d.html)
    - [Image Viewer](https://belaw.github.io/DatPartoutExplorer/imgs.html)
3. Open a .dat partout file
    - Full Tilt Space Cadet example `<game directory>/WIN95/FULLTILT/CADET/CADET.DAT`
    - You can get Full Tilt Pinball on My Abandonware: https://www.myabandonware.com/game/full-tilt-pinball-a3m


## 3D model reconstruction

- .dae export (can be imported into blender etc.)
- Automatic mesh + UV map generation from the point cloud

https://user-images.githubusercontent.com/5871005/202822184-9508f931-43a9-478e-899f-e60a958f8188.mp4

## Screenshots

![image](https://user-images.githubusercontent.com/5871005/202816248-3c438e6e-5139-4856-bf4b-b45593f25eb5.png)
![image](https://user-images.githubusercontent.com/5871005/202816055-178aaef7-f21b-459a-ba52-62ef4c3fef81.png)
![image](https://user-images.githubusercontent.com/5871005/202816064-04abfc06-11ed-4ced-afae-78e8066c0e71.png)
![image](https://user-images.githubusercontent.com/5871005/202816149-e2c19935-00d9-4165-af59-fec4b5cc8ce9.png)
