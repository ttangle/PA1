let tg = Math.tan;
let sin = Math.sin;
let cos = Math.cos;

function get(name) {
    return parseFloat(document.getElementById(name).value);
}

function ModelBuilder() {
    const h = get('H');
    const c = get('C');
    const a = get('A');
    const p = parseInt(get('K')) * Math.PI;
    const f = get('F');
    
    const uSteps = get('USteps');
    const vSteps = get('VSteps');

    const uMin = get('UMin');
    const uMax = get('UMax');

    const vMin = get('VMin');
    const vMax = get('VMax');

    const du = (uMax - uMin) / uSteps;
    const dv = (vMax - vMin) / vSteps;

    this.sigma = function(u) {
        return p * u;
    }

    this.fx = function(u, v) {
        let s = this.sigma(u);
        return (c * u) + v * (sin(f) + tg(a) * cos(f) * cos(s));
    }

    this.fy = function(u, v) {
        return v * tg(a) * sin(this.sigma(u));
    }

    this.fz = function(u, v) {
        return h + v * (tg(a) * sin(f) * cos(this.sigma(u)) - cos(f));
    }

    this.build = function() {
        const vertices = [];
        const indices = [];

        let max_x = undefined;
        let min_x = undefined;

        for (let i = 0; i <= uSteps; i++) {
            const u = uMin + i * du;
            for (let j = 0; j <= vSteps; j++) {
                const v = vMin + j * dv;
         
                const x = this.fx(u, v);

                max_x = max_x == undefined ? x : Math.max(x, max_x);
                min_x = min_x == undefined ? x : Math.min(x, min_x);

                const y = this.fy(u, v);
                const z = this.fz(u, v);
    
                vertices.push(x, y, z);
            }
        }

        for(let i = 0; i < vertices.length; i += 3) {
            vertices[i] -= (max_x - min_x) / 2.0;
        }
    
        for (let i = 0; i <= uSteps; i++) {
            for (let j = 0; j <= vSteps; j++) {
                const currentIndex = i * (vSteps + 1) + j;
                const prevUIndex = (i - 1) * (vSteps + 1) + j;
                const prevVIndex = i * (vSteps + 1) + (j - 1);
    
                if(i > 0) {
                    indices.push(currentIndex, prevUIndex);
                }
    
                if(j > 0) {
                    indices.push(currentIndex, prevVIndex);
                }
            }
        }

        return { vertices, indices };
    }
}

function Model(gl, shProgram) {
    this.iVertexBuffer = gl.createBuffer();
    this.iIndexBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function(vertices, indices) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        this.count = indices.length;
    };

    this.Draw = function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);

        gl.drawElements(gl.LINES, this.count, gl.UNSIGNED_SHORT, 0);
    }

    this.CreateSurfaceData = function() {
        let builder = new ModelBuilder();
        const { vertices, indices } = builder.build();
        this.BufferData(vertices, indices);
    }
}
