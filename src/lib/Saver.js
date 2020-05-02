const link = document.createElement('a');
link.style.display = 'none';
document.body.appendChild(link); // Firefox workaround, see #6594

function save(blob, filename) {

    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();

    // URL.revokeObjectURL( url ); breaks Firefox...

}

export function saveString(text, filename) {
    save(new Blob([text], { type: 'text/plain' }), filename);
}

export function saveArrayBuffer( buffer, filename ) {
    save( new Blob( [ buffer ], { type: 'application/octet-stream' } ), filename );
}