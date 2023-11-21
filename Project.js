import {defs, tiny} from './examples/common.js';

const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene,
} = tiny;

export class Platform{
    constructor(start_pos, length, radius) {
        this.start_pos = start_pos;
        this.base_transform = Mat4.translation(0, 0, this.start_pos + length / 2);
        this.len = length;
        this.radius = radius;
    }

    draw(context, program_state, tube, mat){
        let model_transform = this.base_transform.times(Mat4.scale(this.radius, this.radius, this.len));
        tube.draw(context, program_state, model_transform, mat);
    }
}

export class Project extends Scene {
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            torus: new defs.Torus(15, 15),
            torus2: new defs.Torus(3, 15),
            sphere: new defs.Subdivision_Sphere(4),
            circle: new defs.Regular_2D_Polygon(1, 15),
            tube: new defs.Cylindrical_Tube(10, 50, [[0, 2], [0, 1]]),
            // TODO:  Fill in as many additional shape instances as needed in this key/value table.
            //        (Requirement 1)
        };

        // *** Materials
        this.materials = {
            test: new Material(new defs.Phong_Shader(),
                {ambient: 1, diffusivity: .6, color: hex_color("#ffffff")}),
            player_material: new Material(new defs.Phong_Shader(),
                {ambient: 0.4, diffusivity: .6, color: hex_color("#0000FF")}),
            // TODO:  Fill in as many additional material objects as needed in this key/value table.
            //        (Requirement 4)
        }

        this.platform_radius = 5;
        this.platform_length = 50;

        this.player_depth_offset = 20;

        this.player_depth = 0;
        this.player_height = 2;
        this.player_tranform = Mat4.identity().times(Mat4.translation(0, -this.platform_radius + this.player_height/2, 0));
        this.player_angle = 0;

        this.moving = 0; //-1 for left, 0 for none, 1 for right

        this.camera_position = Mat4.look_at(vec3(0, 0, -1), vec3(0, 0, 0), vec3(0, 1, 0));

        this.platforms = [];
        this.next_platform = 0;
    }

    make_control_panel() {
        // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        this.key_triggered_button("Move left", ["a"], () => this.moving = -1);
        this.key_triggered_button("Stop", ["s"], () => this.moving = 0);
        this.key_triggered_button("Move right", ["d"], () => this.moving = 1);
    }

    //draws platforms, deletes old and adds new.
    platform(context, program_state){
        if (this.platforms[0].start_pos + this.platform_length + 20 < this.player_depth){
            this.platforms.shift()
            this.platforms.push(new Platform(this.next_platform * this.platform_length, this.platform_length, this.platform_radius));
            this.next_platform += 1;
        }

        const red = hex_color("#FF7276");
        const purple = hex_color("#800080");

        /*this.platforms.forEach(function (el){
            el.draw(context, program_state, this.shapes.tube, this.materials.test.override({color: yellow}));
        });*/

        for (let i = 0; i < this.platforms.length; i++){
            this.platforms[i].draw(context, program_state, this.shapes.tube, this.materials.test.override({color: (i + this.next_platform) % 2 === 0? red : purple}));
        }

        /*;
        let model_transform = Mat4.translation(0, 0, 0).times(Mat4.scale(this.platform_radius, this.platform_radius, this.platform_length));
        this.shapes.tube.draw(context, program_state, model_transform, this.materials.test.override({color: yellow}));*/
    }

    //positions player based on depths and angle
    player(context, program_state)
    {
        this.player_angle -= this.moving * Math.PI / 180;
        this.player_depth = program_state.animation_time / 50 + this.player_depth_offset;
        let depth_transform = Mat4.translation(0, 0, this.player_depth);
        this.shapes.sphere.draw(context, program_state, Mat4.rotation(this.player_angle, 0, 0, 1).times(this.player_tranform).times(depth_transform), this.materials.player_material)
    }

    //camera setup such that it follows the player at an offset, light source from camera as well
    camera(context, program_state){
        let eye = Mat4.translation(0, 0, this.player_depth - 15).times(vec4(0, 0, 0, 1));
        let at = Mat4.translation(0, 0, this.player_depth).times(vec4(0, 0, 0, 1));
        let up = Mat4.translation(0, 1, this.player_depth).times(vec4(0, 0, 0, 1));
        program_state.lights = [new Light(eye, color(1, 1, 1, 1), 1000)];
        this.camera_position = Mat4.look_at(eye.to3(), at.to3(), up.to3());
        program_state.set_camera(this.camera_position);
    }

    display(context, program_state) {
        // display():  Called once per frame of animation.
        // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
        if (!context.scratchpad.controls) {
            //this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(this.camera_position);
        }

        if (this.platforms.length < 2){
            this.platforms.push(new Platform(this.next_platform * this.platform_length, this.platform_length, this.platform_radius));
            this.next_platform += 1;
            this.platforms.push(new Platform(this.next_platform * this.platform_length, this.platform_length, this.platform_radius));
            this.next_platform += 1;
            this.platforms.push(new Platform(this.next_platform * this.platform_length, this.platform_length, this.platform_radius));
            this.next_platform += 1;
        }

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, .1, 1000);

        // TODO: Create Planets (Requirement 1)
        // this.shapes.[XXX].draw([XXX]) // <--example

        // TODO: Lighting (Requirement 2)
        const light_position = vec4(0, 5, 5, 1);
        // The parameters of the Light are: position, color, size
        //program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

        // TODO:  Fill in matrix operations and drawing code to draw the solar system scene (Requirements 3 and 4)
        const t = program_state.animation_time / 1000, dt = program_state.animation_delta_time / 1000;

        this.camera(context, program_state);
        this.platform(context, program_state);
        this.player(context, program_state);

    }
}