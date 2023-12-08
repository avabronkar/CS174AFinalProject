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

const { Textured_Phong } = defs;


class RectRatio {
    extEuclid(x, y) {
      while (y !== 0) {
        const t = y;
        y = x % y;
        x = t;
      }
      return x;
    }
  
    constructor(divisor, dividend) {
      this.divisor = divisor;
      this.dividend = dividend;
  
      this.gcd = this.extEuclid(this.divisor, this.dividend);
      this.simplifiedDivisor = this.divisor / this.gcd;
      this.simplifiedDividend = this.dividend / this.gcd;
    }
  }
  class Rect extends defs.Square {
    /**
     * @param {RectRatio} ratio
     * @param {Boolean} vertical
     */
    constructor(ratio, vertical) {
      const simplifiedDivisor = ratio.simplifiedDivisor;
      const simplifiedDividend = ratio.simplifiedDividend;
  
      super("position", "normal", "texture_coord");
  
      if (vertical) {
        this.arrays.position = Vector3.cast(
          [-simplifiedDivisor, -simplifiedDividend, 0],
          [simplifiedDivisor, -simplifiedDividend, 0],
          [-simplifiedDivisor, simplifiedDividend, 0],
          [simplifiedDivisor, simplifiedDividend, 0],
        );
      } else {
        this.arrays.position = Vector3.cast(
          [-simplifiedDividend, -simplifiedDivisor, 0],
          [simplifiedDividend, -simplifiedDivisor, 0],
          [-simplifiedDividend, simplifiedDivisor, 0],
          [simplifiedDividend, simplifiedDivisor, 0],
        );
      }
  
      this.arrays.normal = Vector3.cast(
        [0, 0, 1],
        [0, 0, 1],
        [0, 0, 1],
        [0, 0, 1],
      );
      // Arrange the vertices into a square shape in texture space too:
      this.arrays.texture_coord = Vector.cast([0, 0], [1, 0], [0, 1], [1, 1]);
      // Use two triangles this time, indexing into four distinct vertices:
      this.indices.push(0, 1, 2, 1, 3, 2);
    }
  }  


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
          .times(Mat4.scale(this.radius / 8, this.radius/ 8, 0.1));
      if (this.coin)
        coin.draw(
            context,
            program_state,
            Mat4.rotation(this.coin_angle, 0, 0, 1).times(coin_transform),
            coin_mat,
        )
    }
  }
}

class Player{
  draw(context, program_state, player_transform, sphere, cube, player_mat){
    sphere.draw(
        context,
        program_state,
        player_transform,//.times(Mat4.scale(0.5, 0.5, 0.5)).times(Mat4.translation(0, 2, 0)),
        player_mat
    );
  }
}
export class Project extends Scene {
  constructor() {
    // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
    super();
    this.init()

    this.shapes = {
      torus: new defs.Torus(15, 15),
      torus2: new defs.Torus(3, 15),
      sphere: new defs.Subdivision_Sphere(4),
      circle: new defs.Regular_2D_Polygon(1, 15),
      cube: new (defs.Cube.prototype.make_flat_shaded_version())(),
      square: new defs.Square(),
      //coin: new defs.Torus(50, 50),
      //coin: new defs.Subdivision_Sphere(4),
      coin: new defs.Capped_Cylinder(20, 20, [0, 2], [0, 1]),
      tube: new defs.Cylindrical_Tube(10, 50, [
        [0, 2],
        [0, 1],
      ]),
      rect: new Rect(new RectRatio(1, 2), false),

    };

    this.materials = {
      test: new Material(new defs.Phong_Shader(), {
        ambient: 1,
        specularity: 0,
        color: hex_color("#ffffff"),
      }),
      test2: new Material(new defs.Basic_Shader(), {
        color: hex_color("#ffffff"),
      }),
      rect: new Material(new defs.Phong_Shader(), {
        ambient: 1,
        diffusivity: 0,
        color: hex_color("#f55fff"),
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
      start_screen: new Material(new Textured_Phong(), {
        color: hex_color("#000000"),
        ambient: 1,
        texture: new Texture("assets/start-screen-flipped.png"),
      }),
      lose_screen: new Material(new Textured_Phong(), {
        color: hex_color("#000000"),
        ambient: 1,
        texture: new Texture("assets/lose-screen-flipped.png"),
      }),
      player_anim1: new Material(new Textured_Phong(), {
        color: hex_color("#000000"),
        ambient: 1,
        texture: new Texture("assets/player-anim1.png"),
      }),
      player_anim2: new Material(new Textured_Phong(), {
        color: hex_color("#000000"),
        ambient: 1,
        texture: new Texture("assets/player-anim2.png"),
      }),
      player_anim3: new Material(new Textured_Phong(), {
        color: hex_color("#000000"),
        ambient: 1,
        texture: new Texture("assets/player-anim3.png"),
      }),
      player_anim4: new Material(new Textured_Phong(), {
        color: hex_color("#000000"),
        ambient: 1,
        texture: new Texture("assets/player-anim4.png"),
      }),
      SCORE_TEXT: new Material(new defs.Textured_Phong(), {
        ambient: 1,
        specularity: 0,
        color: hex_color("#FFFFFF"),
        texture: new Texture("assets/SCORE.png")
      }),
      0: new Material(new defs.Textured_Phong(), {
        ambient: 1,
        specularity: 0,
        color: hex_color("#FFFFFF"),
        texture: new Texture("assets/0.png")
      }),
      1: new Material(new defs.Textured_Phong(), {
        ambient: 1,
        specularity: 0,
        color: hex_color("#FFFFFF"),
        texture: new Texture("assets/1.png")
      }),
      2: new Material(new defs.Textured_Phong(), {
        ambient: 1,
        specularity: 0,
        color: hex_color("#FFFFFF"),
        texture: new Texture("assets/2.png")
      }),
      3: new Material(new defs.Textured_Phong(), {
        ambient: 1,
        specularity: 0,
        color: hex_color("#FFFFFF"),
        texture: new Texture("assets/3.png")
      }),
      4: new Material(new defs.Textured_Phong(), {
        ambient: 1,
        specularity: 0,
        color: hex_color("#FFFFFF"),
        texture: new Texture("assets/4.png")
      }),
      5: new Material(new defs.Textured_Phong(), {
        ambient: 1,
        specularity: 0,
        color: hex_color("#FFFFFF"),
        texture: new Texture("assets/5.png")
      }),
      6: new Material(new defs.Textured_Phong(), {
        ambient: 1,
        specularity: 0,
        color: hex_color("#FFFFFF"),
        texture: new Texture("assets/6.png")
      }),
      7: new Material(new defs.Textured_Phong(), {
        ambient: 1,
        specularity: 0,
        color: hex_color("#FFFFFF"),
        texture: new Texture("assets/7.png")
      }),
      8: new Material(new defs.Textured_Phong(), {
        ambient: 1,
        specularity: 0,
        color: hex_color("#FFFFFF"),
        texture: new Texture("assets/8.png")
      }),
      9: new Material(new defs.Textured_Phong(), {
        ambient: 1,
        specularity: 0,
        color: hex_color("#FFFFFF"),
        texture: new Texture("assets/9.png")
      }),
    };

    this.widths = {
      0 : 0.035,
      1 : 0.022,
      2 : 0.034,
      3 : 0.035,
      4 : 0.035,
      5 : 0.038,
      6 : 0.035,
      7 : 0.035,
      8 : 0.037,
      9 : 0.035
    }
    this.offsets = {
      0 : 0.51,
      1 : 0.52,
      2 : 0.51,
      3 : 0.51,
      4 : 0.51,
      5 : 0.51,
      6 : 0.51,
      7 : 0.512,
      8 : 0.51,
      9 : 0.51
    }
  }

  init(){

    // At the beginning of our program, load one of each of these shape definitions onto the GPU.


    this.score = 0;

    // *** Materials




    this.platform_radius = 5;
    this.platform_length = 50;

    this.player_depth_offset = 20;

    this.player_depth = 0;
    this.player_height = 2;
    this.player_transform = Mat4.identity().times(
      Mat4.translation(0, -this.platform_radius + this.player_height / 2, 0),
    );
    this.player_angle = 0;

    this.lastCollisionValue = 0;

    this.moving = 0; //-1 for left, 0 for none, 1 for right

    this.gameActive = false;
    this.lost = false;

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
    this.key_triggered_button( "Start", ["g"], () => {
    if (!this.gameActive) this.program_state.animation_time = 0;
      this.gameActive = true;
    });
    this.key_triggered_button( "Move Left", ["a"], () => {
       if(!this.paused) this.moving = -1;
    });
    this.key_triggered_button("Stop", ["s"], () => (this.moving = 0));
    this.key_triggered_button("Move Right", ["d"], () => {
        if(!this.paused) this.moving = 1;
    });
    this.key_triggered_button("Pause", ["p"], () => {
      if (!this.paused)
        this.saved_animation_time = this.program_state.animation_time;
      else this.program_state.animation_time = this.saved_animation_time;
      this.paused = !this.paused;
      this.moving = 0;
    });
    this.key_triggered_button( "Restart", ["r"], () => {
        if (this.lost){
          this.init();
          this.program_state.animation_time = 0;
        }
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

    const num = this.paused ? 4: Math.floor(this.program_state.animation_time % 4);
    if (num === 0) {
      this.shapes.square.draw(
        context,
        program_state,
        Mat4.rotation(this.player_angle, 0, 0, 1)
          .times(this.player_transform)
          .times(depth_transform),
        this.materials.player_anim4,
      );
    } else if (num === 1) {
      this.shapes.square.draw(
        context,
        program_state,
        Mat4.rotation(this.player_angle, 0, 0, 1)
          .times(this.player_transform)
          .times(depth_transform),
        this.materials.player_anim3,
      );
    } else if (num === 2) {
      this.shapes.square.draw(
        context,
        program_state,
        Mat4.rotation(this.player_angle, 0, 0, 1)
          .times(this.player_transform)
          .times(depth_transform),
        this.materials.player_anim2,
      );
    } else {
      this.shapes.square.draw(
        context,
        program_state,
        Mat4.rotation(this.player_angle, 0, 0, 1)
          .times(this.player_transform)
          .times(depth_transform),
        this.materials.player_anim1,
      );
    }
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

    if (this.gameActive) {
      this.shapes.square.draw(context, program_state, Mat4.translation(0.63, 0.3, 1).times(this.camera_position).times(Mat4.scale(0.1, 0.1, 1)), this.materials.SCORE_TEXT);


      let str = this.score.toString()

      let delX = 0;

      for (let i = 0; i < str.length; i++) {
        let num = parseInt(str[i])
        this.shapes.square.draw(context, program_state, Mat4.translation(delX + this.offsets[num], 0.38, 1).times(this.camera_position).times(Mat4.scale(0.02, 0.02, 1)), this.materials[num]);
        delX -= this.widths[num];
      }
    }


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
                ) < 20
            ) {
              // console.log("player angle:", ((((this.player_angle * 180) / Math.PI) % 360) + 360));
              // console.log("coin angle", (((barrier.coin_angle * 180) / Math.PI + 90) % 360));
              //console.log("1");
              this.last_collision = program_state.animation_time;
              if ((barrier.base_transform.times(vec4(0, 0, 25, 1)).to3()[2] - this.lastCollisionValue) > 10) {
                this.lastCollisionValue = barrier.base_transform.times(vec4(0, 0, 25, 1)).to3()[2];
                this.score = this.score + 1;
                barrier.coin = false;
              }
              //console.log("score: ", this.score);
            }
            if (
                Math.abs(
                    (((this.player_angle * 180) / Math.PI) % 360) +
                    360 -
                    (((barrier.coin_angle * 180) / Math.PI + 90) % 360),
                ) > 340
            ) {
              // console.log("player angle: ", (((this.player_angle * 180) / Math.PI) % 360) + 360);
              // console.log("coin angle", (((barrier.coin_angle * 180) / Math.PI + 90) % 360));
              //console.log("2");
              if ((barrier.base_transform.times(vec4(0, 0, 25, 1)).to3()[2] - this.lastCollisionValue) > 10) {
                this.lastCollisionValue = barrier.base_transform.times(vec4(0, 0, 25, 1)).to3()[2];
                this.score = this.score + 1;
                barrier.coin = false;
              }
              //console.log("score: ", this.score);
            }
          } else {
            if (
                Math.abs(
                    (((this.player_angle * 180) / Math.PI) % 360) -
                    (((barrier.coin_angle * 180) / Math.PI + 90) % 360),
                ) < 20
            ) {
              // console.log("player angle:", (((this.player_angle * 180) / Math.PI) % 360));
              // console.log("coin angle:", (((barrier.coin_angle * 180) / Math.PI + 90) % 360));
              //console.log("3"); //works as expected
              if ((barrier.base_transform.times(vec4(0, 0, 25, 1)).to3()[2] - this.lastCollisionValue) > 10) {
                this.lastCollisionValue = barrier.base_transform.times(vec4(0, 0, 25, 1)).to3()[2];
                this.score = this.score + 1;
                barrier.coin = false;
              }
              //console.log("score: ", this.score);
            }
            if (
                Math.abs(
                    (((this.player_angle * 180) / Math.PI) % 360) -
                    (((barrier.coin_angle * 180) / Math.PI + 90) % 360),
                ) > 340
            ) {
              // console.log("player angle:", ((this.player_angle * 180) / Math.PI) % 360);
              // console.log("coin angle:", (((barrier.coin_angle * 180) / Math.PI + 90) % 360));
              //console.log("4");
              if ((barrier.base_transform.times(vec4(0, 0, 25, 1)).to3()[2] - this.lastCollisionValue) > 10) {
                this.lastCollisionValue = barrier.base_transform.times(vec4(0, 0, 25, 1)).to3()[2];
                this.score = this.score + 1;
                barrier.coin = false;
              }
              //console.log("score: ", this.score);
            }
          }
        } else {
          if ((this.player_angle * 180) / Math.PI < 0) {
            if (
                Math.abs(
                    (((this.player_angle * 180) / Math.PI) % 360) +
                    360 -
                    ((barrier.coin_angle * 180) / Math.PI + 90),
                ) < 20
            ) {
              // //console.log("player angle", (((this.player_angle * 180) / Math.PI) % 360)+360);
              // //console.log("coin angle: ", ((barrier.coin_angle * 180) / Math.PI + 90));
              //console.log("5"); //working as expected
              if ((barrier.base_transform.times(vec4(0, 0, 25, 1)).to3()[2] - this.lastCollisionValue) > 10) {
                this.lastCollisionValue = barrier.base_transform.times(vec4(0, 0, 25, 1)).to3()[2];
                this.score = this.score + 1;
                barrier.coin = false;
              }
              //console.log("score: ", this.score);
            }
            if (
                Math.abs(
                    (((this.player_angle * 180) / Math.PI) % 360) +
                    360 -
                    ((barrier.coin_angle * 180) / Math.PI + 90),
                ) > 340
            ) {
              // //console.log("player angle:", ((((this.player_angle * 180) / Math.PI) % 360) + 360));
              // //console.log("coin angle:", ((barrier.coin_angle * 180) / Math.PI + 90));
              //console.log("6"); //working as expected
              if ((barrier.base_transform.times(vec4(0, 0, 25, 1)).to3()[2] - this.lastCollisionValue) > 10) {
                this.lastCollisionValue = barrier.base_transform.times(vec4(0, 0, 25, 1)).to3()[2];
                this.score = this.score + 1;
                barrier.coin = false;
              }
              //console.log("score: ", this.score);
            }
          } else {
            if (
                Math.abs(
                    (((this.player_angle * 180) / Math.PI) % 360) -
                    ((barrier.coin_angle * 180) / Math.PI + 90),
                ) < 20
            ) {
              // //console.log("player angle", (((this.player_angle * 180) / Math.PI) % 360));
              // //console.log("coin angle", ((barrier.coin_angle * 180) / Math.PI + 90));
              //console.log("7"); //working as expected
              if ((barrier.base_transform.times(vec4(0, 0, 25, 1)).to3()[2] - this.lastCollisionValue) > 10) {
                this.lastCollisionValue = barrier.base_transform.times(vec4(0, 0, 25, 1)).to3()[2];
                this.score = this.score + 1;
                barrier.coin = false;
              }
              //console.log("score: ", this.score);
            }
            if (
                Math.abs(
                    (((this.player_angle * 180) / Math.PI) % 360) -
                    ((barrier.coin_angle * 180) / Math.PI + 90),
                ) > 340
            ) {
              // //console.log("player angle: ", (((this.player_angle * 180) / Math.PI) % 360));
              // //console.log("coin angle: ", ((barrier.coin_angle * 180) / Math.PI + 90));
              //console.log("8"); //working as expected
              if ((barrier.base_transform.times(vec4(0, 0, 25, 1)).to3()[2] - this.lastCollisionValue) > 10) {
                this.lastCollisionValue = barrier.base_transform.times(vec4(0, 0, 25, 1)).to3()[2];
                this.score = this.score + 1;
                barrier.coin = false;
              }
              //console.log("score: ", this.score);
            }
          }
        }
      }
    }
  }
  showStartScreen(context, program_state) {
    this.shapes.square.draw(
      context,
      program_state,
      Mat4.translation(0, 0, -13),
      this.materials.start_screen,
    );
  }

  showLoseScreen(context, program_state) {
    let depth_transform = Mat4.translation(0, 0, this.player_depth - 12);
    this.shapes.square.draw(
      context,
      program_state,
      depth_transform,
      this.materials.lose_screen,
    );
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
    // this.platform(context, program_state);
    // this.player(context, program_state);
    // this.checkBarrierCollisions(program_state);
    // this.checkCoinCollisions(program_state);
    // const angle = Math.cos(0.005 * this.program_state.animation_time) ;
    
     if (this.last_collision > 0) {
         this.lost = true;
         //console.log("collision");
       }
  
      if (this.gameActive && !this.lost) {
        this.platform(context, program_state);
        this.player(context, program_state);
        this.checkBarrierCollisions(program_state);
        this.checkCoinCollisions(program_state);
      } else if (this.lost) {
        this.showLoseScreen(context, program_state);
      } else {
        this.showStartScreen(context, program_state);
      }

  }
}

