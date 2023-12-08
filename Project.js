import { defs, tiny } from "./examples/common.js";
import { Text_Line } from "./examples/text-demo.js";

const {
  Vector,
  Vector3,
  vec,
  vec3,
  vec4,
  color,
  hex_color,
  Shader,
  Matrix,
  Mat4,
  Light,
  Shape,
  Material,
  Scene,
    Texture
} = tiny;

export class Platform {
  constructor(start_pos, length, radius, barrier = true, paused, score) {
    this.start_pos = start_pos;
    this.base_transform = Mat4.translation(0, 0, this.start_pos + length / 2);
    this.len = length;
    this.radius = radius;
    this.barrier = barrier;
    this.barrier_angle = 2 * Math.PI * Math.random();
    this.coin_angle = 2 * Math.PI * Math.random();
    this.paused = paused;
    //this.score_display = new Text_Line(10);
    this.score = 0;
    this.lastCollisionValue = 0;
    this.coin = true;
  }

  draw(context, program_state, tube, cube, coin, mat, barrier_mat, coin_mat) {
    let model_transform = this.base_transform.times(
      Mat4.scale(this.radius, this.radius, this.len),
    );
    tube.draw(context, program_state, model_transform, mat);

    if (this.barrier) {
      const red = hex_color("#FF0000");
      let barrier_transform = Mat4.translation(
        this.radius,
        0,
        this.start_pos + this.len / 2,
      ).times(Mat4.scale(this.radius, this.radius, 0.1));
      cube.draw(
        context,
        program_state,
        Mat4.rotation(this.barrier_angle, 0, 0, 1).times(barrier_transform),
          barrier_mat.override({ color: red, diffusivity: 1, ambient: 0.2 }),
      );

      const coin_transform = Mat4.translation(this.radius - 1.5, 0, this.start_pos + this.len/2 + 25,)
          .times(Mat4.scale(this.radius /5, this.radius/5, 0.1));
      if (this.coin)
        coin.draw(
            context,
            program_state,
            Mat4.rotation(this.coin_angle, 0, 0, 1).times(coin_transform),
            coin_mat,
        )

    }


// this.shapes.coin.draw(
//   context,
//   program_state,
//   Mat4.identity().times(Mat4.rotation( 2 * angle,0, 1, 0)),
//   this.materials.coin,
// );


  }
}

export class Project extends Scene {
  constructor() {
    // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
    super();
    this.program_state = null;

    // At the beginning of our program, load one of each of these shape definitions onto the GPU.
    this.shapes = {
      torus: new defs.Torus(15, 15),
      torus2: new defs.Torus(3, 15),
      sphere: new defs.Subdivision_Sphere(4),
      circle: new defs.Regular_2D_Polygon(1, 15),
      cube: new (defs.Cube.prototype.make_flat_shaded_version())(),
      //coin: new defs.Torus(50, 50),
      //coin: new defs.Subdivision_Sphere(4),
      coin: new defs.Capped_Cylinder(20, 20, [0, 2], [0, 1]),
      tube: new defs.Cylindrical_Tube(10, 50, [
        [0, 2],
        [0, 1],
      ]),
      // TODO:  Fill in as many additional shape instances as needed in this key/value table.
      //        (Requirement 1)
    };

    // *** Materials
    this.materials = {
      test: new Material(new defs.Phong_Shader(), {
        ambient: 1,
        specularity: 0,
        color: hex_color("#ffffff"),
      }),
      pipe:  new Material(new defs.Textured_Phong(), {
        ambient: 0.3,
        specularity: 0,
        color: hex_color("#A9A9A9"),
        texture: new Texture("assets/pipe.jpg")
      }),
      chain:  new Material(new defs.Textured_Phong(), {
        ambient: 0.3,
        specularity: 0,
        color: hex_color("#A9A9A9"),
        texture: new Texture("assets/chain.png")
      }),
      coin:  new Material(new defs.Textured_Phong(), {
        ambient: 1,
        specularity: 0,
        texture: new Texture("assets/coin.png")
      }),
      player_material: new Material(new defs.Phong_Shader(), {
        ambient: 0.4,
        diffusivity: 0.6,
        color: hex_color("#0000FF"),
      }),
      // TODO:  Fill in as many additional material objects as needed in this key/value table.
      //        (Requirement 4)
    };

    this.platform_radius = 5;
    this.platform_length = 50;

    this.player_depth_offset = 20;

    this.player_depth = 0;
    this.player_height = 2;
    this.player_transform = Mat4.identity().times(
      Mat4.translation(0, -this.platform_radius + this.player_height / 2, 0),
    );
    this.player_angle = 0;

    this.moving = 0; //-1 for left, 0 for none, 1 for right
    this.paused = false;
    this.saved_animation_time = 0;

    this.camera_position = Mat4.look_at(
      vec3(0, 0, -1),
      vec3(0, 0, 0),
      vec3(0, 1, 0),
    );

    this.platforms = [];
    this.next_platform = 0;

    this.movement_speed = 1;

    this.last_collision = -10000;
  }

  make_control_panel() {
    // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
    this.key_triggered_button(
      "Move clockwise",
      ["a"],
      () => (this.moving = -1),
    );
    this.key_triggered_button("Stop", ["s"], () => (this.moving = 0));
    this.key_triggered_button(
      "Move counter-clockwise",
      ["d"],
      () => (this.moving = 1),
    );
    this.key_triggered_button("Pause", ["p"], () => {
      if (!this.paused)
        this.saved_animation_time = this.program_state.animation_time;
      else this.program_state.animation_time = this.saved_animation_time;
      this.paused = !this.paused;
      this.moving = 0;
    });
  }

  //draws platforms, deletes old and adds new.
  platform(context, program_state) {
    if (
      this.platforms[0].start_pos + this.platform_length + 20 <
      this.player_depth
    ) {
      this.platforms.shift();
      this.platforms.push(
        new Platform(
          this.next_platform * this.platform_length,
          this.platform_length,
          this.platform_radius,
        ),
      );
      this.next_platform += 1;
    }

    const red = hex_color("#FF7276");
    const purple = hex_color("#800080");

    /*this.platforms.forEach(function (el){
            el.draw(context, program_state, this.shapes.tube, this.materials.test.override({color: yellow}));
        });*/

    for (let i = 0; i < this.platforms.length; i++) {
      this.platforms[i].draw(
        context,
        program_state,
        this.shapes.tube,
        this.shapes.cube,
        //this.shapes.sphere,
        this.shapes.coin,
        this.materials.pipe,
            //.override({ color: (i + this.next_platform) % 2 === 0 ? red : purple, }),
        this.materials.chain,
          this.materials.coin
      );
    }


    /*;
        let model_transform = Mat4.translation(0, 0, 0).times(Mat4.scale(this.platform_radius, this.platform_radius, this.platform_length));
        this.shapes.tube.draw(context, program_state, model_transform, this.materials.test.override({color: yellow}));*/
  }

  //positions player based on depths and angle
  player(context, program_state) {
    this.player_angle -= (this.moving * this.movement_speed * Math.PI) / 180;

    this.player_depth = this.paused
      ? this.saved_animation_time / 50 + this.player_depth_offset
      : this.program_state.animation_time / 50 + this.player_depth_offset;

    let depth_transform = Mat4.translation(0, 0, this.player_depth);

    let normal = hex_color("#0000FF");
    let hit = hex_color("#FFFF00");

    this.shapes.sphere.draw(
      context,
      program_state,
      Mat4.rotation(this.player_angle, 0, 0, 1)
        .times(this.player_transform)
        .times(depth_transform),
      this.materials.player_material.override({
        color:
          program_state.animation_time - this.last_collision < 1000
            ? hit
            : normal,
      }),
    );
  }

  //camera setup such that it follows the player at an offset, light source from camera as well
  camera(context, program_state) {
    let eye = Mat4.translation(0, 0, this.player_depth - 15).times(
      vec4(0, 0, 0, 1),
    );
    let at = Mat4.translation(0, 0, this.player_depth).times(vec4(0, 0, 0, 1));
    let up = Mat4.translation(0, 1, this.player_depth).times(vec4(0, 0, 0, 1));
    program_state.lights = [new Light(eye, color(1, 1, 1, 1), 1000)];
    this.camera_position = Mat4.look_at(eye.to3(), at.to3(), up.to3());
    program_state.set_camera(this.camera_position);
  }

  checkBarrierCollisions(program_state) {
    for (let i = 0; i < this.platforms.length; i++) {
      const barrier = this.platforms[i];
      if (!barrier.barrier) return;
      if (
        Math.abs(
          barrier.base_transform.times(vec4(0, 0, 0, 1)).to3()[2] -
            this.player_transform
              .times(Mat4.translation(0, 0, this.player_depth))
              .times(vec4(0, 0, 0, 1))
              .to3()[2],
        ) < 1
      ) {
        if ((barrier.barrier_angle * 180) / Math.PI > 270) {
          if ((this.player_angle * 180) / Math.PI < 0) {
            if (
              Math.abs(
                (((this.player_angle * 180) / Math.PI) % 360) +
                  360 -
                  (((barrier.barrier_angle * 180) / Math.PI + 90) % 360),
              ) < 100
            ) {
              this.last_collision = program_state.animation_time;
            }
            if (
              Math.abs(
                (((this.player_angle * 180) / Math.PI) % 360) +
                  360 -
                  (((barrier.barrier_angle * 180) / Math.PI + 90) % 360),
              ) > 260
            ) {
              this.last_collision = program_state.animation_time;
            }
          } else {
            if (
              Math.abs(
                (((this.player_angle * 180) / Math.PI) % 360) -
                  (((barrier.barrier_angle * 180) / Math.PI + 90) % 360),
              ) < 100
            ) {
              this.last_collision = program_state.animation_time;
            }
            if (
              Math.abs(
                (((this.player_angle * 180) / Math.PI) % 360) -
                  (((barrier.barrier_angle * 180) / Math.PI + 90) % 360),
              ) > 260
            ) {
              this.last_collision = program_state.animation_time;
            }
          }
        } else {
          if ((this.player_angle * 180) / Math.PI < 0) {
            if (
              Math.abs(
                (((this.player_angle * 180) / Math.PI) % 360) +
                  360 -
                  ((barrier.barrier_angle * 180) / Math.PI + 90),
              ) < 100
            ) {
              this.last_collision = program_state.animation_time;
            }
            if (
              Math.abs(
                (((this.player_angle * 180) / Math.PI) % 360) +
                  360 -
                  ((barrier.barrier_angle * 180) / Math.PI + 90),
              ) > 260
            ) {
              this.last_collision = program_state.animation_time;
            }
          } else {
            if (
              Math.abs(
                (((this.player_angle * 180) / Math.PI) % 360) -
                  ((barrier.barrier_angle * 180) / Math.PI + 90),
              ) < 100
            ) {
              this.last_collision = program_state.animation_time;
            }
            if (
              Math.abs(
                (((this.player_angle * 180) / Math.PI) % 360) -
                  ((barrier.barrier_angle * 180) / Math.PI + 90),
              ) > 260
            ) {
              this.last_collision = program_state.animation_time;
            }
          }
        }
      }
    }
  }

  checkCoinCollisions(program_state) {
    for (let i = 0; i < this.platforms.length; i++) {
      const barrier = this.platforms[i];
      //let coinAngle = 0;
      //let playerAngle = ;
      //if barrier.coin_angle

      if (!barrier.barrier) return;
      if (
          Math.abs(
              barrier.base_transform.times(vec4(0, 0, 25, 1)).to3()[2] -
              this.player_transform
                  .times(Mat4.translation(0, 0, this.player_depth))
                  .times(vec4(0, 0, 0, 1))
                  .to3()[2],
          ) < 1
      ) {
        if (isNaN(this.score)){
          this.score = 0; //should not be evaluating to NaN but currently is
        }
        if (isNaN(this.lastCollisionValue)){
          this.lastCollisionValue = 0; //should not be evaluating to NaN but currently is
        }
        if ((barrier.coin_angle * 180) / Math.PI > 350) {
          if ((this.player_angle * 180) / Math.PI < 0) {
            if (
                Math.abs(
                    (((this.player_angle * 180) / Math.PI) % 360) +
                    360 -
                    (((barrier.coin_angle * 180) / Math.PI + 90) % 360),
                ) < 10
            ) {
              // console.log("player angle:", ((((this.player_angle * 180) / Math.PI) % 360) + 360));
              // console.log("coin angle", (((barrier.coin_angle * 180) / Math.PI + 90) % 360));
              console.log("1");
              this.last_collision = program_state.animation_time;
              if ((barrier.base_transform.times(vec4(0, 0, 25, 1)).to3()[2] - this.lastCollisionValue) > 10) {
                this.lastCollisionValue = barrier.base_transform.times(vec4(0, 0, 25, 1)).to3()[2];
                this.score = this.score + 1;
                barrier.coin = false;
              }
              console.log("score: ", this.score);
            }
            if (
                Math.abs(
                    (((this.player_angle * 180) / Math.PI) % 360) +
                    360 -
                    (((barrier.coin_angle * 180) / Math.PI + 90) % 360),
                ) > 350
            ) {
              // console.log("player angle: ", (((this.player_angle * 180) / Math.PI) % 360) + 360);
              // console.log("coin angle", (((barrier.coin_angle * 180) / Math.PI + 90) % 360));
              console.log("2");
              if ((barrier.base_transform.times(vec4(0, 0, 25, 1)).to3()[2] - this.lastCollisionValue) > 10) {
                this.lastCollisionValue = barrier.base_transform.times(vec4(0, 0, 25, 1)).to3()[2];
                this.score = this.score + 1;
                barrier.coin = false;
              }
              console.log("score: ", this.score);
            }
          } else {
            if (
                Math.abs(
                    (((this.player_angle * 180) / Math.PI) % 360) -
                    (((barrier.coin_angle * 180) / Math.PI + 90) % 360),
                ) < 10
            ) {
              // console.log("player angle:", (((this.player_angle * 180) / Math.PI) % 360));
              // console.log("coin angle:", (((barrier.coin_angle * 180) / Math.PI + 90) % 360));
              console.log("3"); //works as expected
              if ((barrier.base_transform.times(vec4(0, 0, 25, 1)).to3()[2] - this.lastCollisionValue) > 10) {
                this.lastCollisionValue = barrier.base_transform.times(vec4(0, 0, 25, 1)).to3()[2];
                this.score = this.score + 1;
                barrier.coin = false;
              }
              console.log("score: ", this.score);
            }
            if (
                Math.abs(
                    (((this.player_angle * 180) / Math.PI) % 360) -
                    (((barrier.coin_angle * 180) / Math.PI + 90) % 360),
                ) > 350
            ) {
              // console.log("player angle:", ((this.player_angle * 180) / Math.PI) % 360);
              // console.log("coin angle:", (((barrier.coin_angle * 180) / Math.PI + 90) % 360));
              console.log("4");
              if ((barrier.base_transform.times(vec4(0, 0, 25, 1)).to3()[2] - this.lastCollisionValue) > 10) {
                this.lastCollisionValue = barrier.base_transform.times(vec4(0, 0, 25, 1)).to3()[2];
                this.score = this.score + 1;
                barrier.coin = false;
              }
              console.log("score: ", this.score);
            }
          }
        } else {
          if ((this.player_angle * 180) / Math.PI < 0) {
            if (
                Math.abs(
                    (((this.player_angle * 180) / Math.PI) % 360) +
                    360 -
                    ((barrier.coin_angle * 180) / Math.PI + 90),
                ) < 10
            ) {
              // console.log("player angle", (((this.player_angle * 180) / Math.PI) % 360)+360);
              // console.log("coin angle: ", ((barrier.coin_angle * 180) / Math.PI + 90));
              console.log("5"); //working as expected
              if ((barrier.base_transform.times(vec4(0, 0, 25, 1)).to3()[2] - this.lastCollisionValue) > 10) {
                this.lastCollisionValue = barrier.base_transform.times(vec4(0, 0, 25, 1)).to3()[2];
                this.score = this.score + 1;
                barrier.coin = false;
              }
              console.log("score: ", this.score);
            }
            if (
                Math.abs(
                    (((this.player_angle * 180) / Math.PI) % 360) +
                    360 -
                    ((barrier.coin_angle * 180) / Math.PI + 90),
                ) > 350
            ) {
              // console.log("player angle:", ((((this.player_angle * 180) / Math.PI) % 360) + 360));
              // console.log("coin angle:", ((barrier.coin_angle * 180) / Math.PI + 90));
              console.log("6"); //working as expected
              if ((barrier.base_transform.times(vec4(0, 0, 25, 1)).to3()[2] - this.lastCollisionValue) > 10) {
                this.lastCollisionValue = barrier.base_transform.times(vec4(0, 0, 25, 1)).to3()[2];
                this.score = this.score + 1;
                barrier.coin = false;
              }
              console.log("score: ", this.score);
            }
          } else {
            if (
                Math.abs(
                    (((this.player_angle * 180) / Math.PI) % 360) -
                    ((barrier.coin_angle * 180) / Math.PI + 90),
                ) < 10
            ) {
              // console.log("player angle", (((this.player_angle * 180) / Math.PI) % 360));
              // console.log("coin angle", ((barrier.coin_angle * 180) / Math.PI + 90));
              console.log("7"); //working as expected
              if ((barrier.base_transform.times(vec4(0, 0, 25, 1)).to3()[2] - this.lastCollisionValue) > 10) {
                this.lastCollisionValue = barrier.base_transform.times(vec4(0, 0, 25, 1)).to3()[2];
                this.score = this.score + 1;
                barrier.coin = false;
              }
              console.log("score: ", this.score);
            }
            if (
                Math.abs(
                    (((this.player_angle * 180) / Math.PI) % 360) -
                    ((barrier.coin_angle * 180) / Math.PI + 90),
                ) > 350
            ) {
              // console.log("player angle: ", (((this.player_angle * 180) / Math.PI) % 360));
              // console.log("coin angle: ", ((barrier.coin_angle * 180) / Math.PI + 90));
              console.log("8"); //working as expected
              if ((barrier.base_transform.times(vec4(0, 0, 25, 1)).to3()[2] - this.lastCollisionValue) > 10) {
                this.lastCollisionValue = barrier.base_transform.times(vec4(0, 0, 25, 1)).to3()[2];
                this.score = this.score + 1;
                barrier.coin = false;
              }
              console.log("score: ", this.score);
            }
          }
        }
      }
    }
  }

  display(context, program_state) {
    // display():  Called once per frame of animation.
    // Setup -- This part sets up the scene's overall camera matrix, projection matrix, and lights:
    if (!context.scratchpad.controls) {
      //this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
      // Define the global camera and projection matrices, which are stored in program_state.
      program_state.set_camera(this.camera_position);
    }

    if (this.platforms.length < 2) {
      this.platforms.push(
        new Platform(
          this.next_platform * this.platform_length,
          this.platform_length,
          this.platform_radius,
          false,
          this.paused,
        ),
      );
      this.next_platform += 1;
      this.platforms.push(
        new Platform(
          this.next_platform * this.platform_length,
          this.platform_length,
          this.platform_radius,
          false,
          this.paused,
        ),
      );
      this.next_platform += 1;
      this.platforms.push(
        new Platform(
          this.next_platform * this.platform_length,
          this.platform_length,
          this.platform_radius,
          false,
          this.paused,
        ),
      );
      this.next_platform += 1;
    }

    program_state.projection_transform = Mat4.perspective(
      Math.PI / 4,
      context.width / context.height,
      0.1,
      1000,
    );

    // TODO: Create Planets (Requirement 1)
    // this.shapes.[XXX].draw([XXX]) // <--example

    // TODO: Lighting (Requirement 2)
    const light_position = vec4(0, 5, 5, 1);
    // The parameters of the Light are: position, color, size
    //program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

    // TODO:  Fill in matrix operations and drawing code to draw the solar system scene (Requirements 3 and 4)
    const t = program_state.animation_time / 1000,
      dt  = program_state.animation_delta_time / 1000;

    this.program_state = program_state;
    this.camera(context, program_state);
    this.platform(context, program_state);
    this.player(context, program_state);
    this.checkBarrierCollisions(program_state);
    this.checkCoinCollisions(program_state);
    const angle = Math.cos(0.005 * this.program_state.animation_time) ;

    // this.score_display.set_string("Score: ", context.context);
    // this.score_display.draw(
    //     context,
    //     program_state,
    //     Mat4.identity().times(Mat4.translation(context.width - 100, 30, 0)),
    //     this.text_image // Make sure to have this.text_image defined in your constructor
    // );

    //console.log("Coin Angle:", (this.platforms[0].coin_angle *180)/Math.PI);
    //console.log("Player Angle:", (((this.player_angle * 180) / Math.PI)));

  }
}

