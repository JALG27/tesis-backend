import { comparePassword, hashPassword } from "./helpers/authHelper.js";
import userModel from "./models/userModel.js"
import orderModel from "./models/orderModel.js";
import JWT from "jsonwebtoken"

export const registerController = async (req,res) => {
    try{
        const {nombre,email,password,telefono,direccion} = req.body
        //validaciones
        if(!nombre){
            return res.send({ message:'El nombre es requerido'})
        }
        if(!email){
            return res.send({ message:'El email es requerido'})
        }
        if(!password){
            return res.send({ message:'El password es requerido'})
        }
        if(!telefono){
            return res.send({ message:'El numero de telefono es requerido'})
        }
        if(!direccion){
            return res.send({ message:'La direccion es requerida'})
        }

        //revision de usuario
        const existingUser = await userModel.findOne({email})
        //usuarios existentes
          if(existingUser){
            return res.status(200).send({
                success:false,
                message:'Usuario registrado, porfavor inicia sesion',
            })
          }
          //registrar usuario
          const hashedPassword = await hashPassword(password);
          //Guardar
          const user = await new userModel({nombre,email,telefono,direccion,password:hashedPassword}).save()

          res.status(201).send({
            success:true,
            message:'Usuario registrado con exito!',
            user,
          })


    } catch (error) {
        console.log(error)
        res.status(500).send({
            success:false,
            message:'Error en el registro',
            error
        })
    }
};

//POST LOGIN
export const loginController = async (req,res) => {
    try {
        const {email,password} = req.body
        //validacion
        if(!email || !password) {
            return res.status(404).send({
                success:false,
                message:'Email o password invalido'
            })
        }
        //check user
        const user = await userModel.findOne({email})
        if(!user){
            return res.status(404).send({
                success:false,
                message:'Email no registrado'
            })
        }
        const match = await comparePassword(password,user.password)
        if(!match){
            return res.status(200).send({
                success:false,
                message:'Password invalido'
            })
        }
        //token
        const token = await JWT.sign({_id:user._id}, process.env.JWT_SECRET, {
            expiresIn:"7d",
    });
    res.status(200).send({
        success:true,
        message:'Login exitoso',
        user:{
            nombre: user.nombre,
            email: user.email,
            telefono: user.telefono,
            direccion: user.direccion,
        },
        token,
    });
    } catch (error) {
        console.log(error)
        res.status(500).send({
            success:false,
            message:'Error en login',
            error
        })
    }
};

export const forgotPasswordController = async (req, res) => {
    try {
      const { email, answer, newPassword } = req.body;
      if (!email) {
        res.status(400).send({ message: "Emai is required" });
      }
      if (!answer) {
        res.status(400).send({ message: "answer is required" });
      }
      if (!newPassword) {
        res.status(400).send({ message: "New Password is required" });
      }
      //check
      const user = await userModel.findOne({ email, answer });
      //validation
      if (!user) {
        return res.status(404).send({
          success: false,
          message: "Wrong Email Or Answer",
        });
      }
      const hashed = await hashPassword(newPassword);
      await userModel.findByIdAndUpdate(user._id, { password: hashed });
      res.status(200).send({
        success: true,
        message: "Password Reset Successfully",
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "Something went wrong",
        error,
      });
    }
  };

//test controller
export const testController = (req,res) =>{
    try{
    res.send("Protected Routes");
    } catch (error) {
        console.log(error);
        res.send({error});
    }
};

//update prfole
export const updateProfileController = async (req, res) => {
    try {
      const { name, email, password, address, phone } = req.body;
      const user = await userModel.findById(req.user._id);
      //password
      if (password && password.length < 6) {
        return res.json({ error: "Passsword is required and 6 character long" });
      }
      const hashedPassword = password ? await hashPassword(password) : undefined;
      const updatedUser = await userModel.findByIdAndUpdate(
        req.user._id,
        {
          name: name || user.name,
          password: hashedPassword || user.password,
          phone: phone || user.phone,
          address: address || user.address,
        },
        { new: true }
      );
      res.status(200).send({
        success: true,
        message: "Profile Updated SUccessfully",
        updatedUser,
      });
    } catch (error) {
      console.log(error);
      res.status(400).send({
        success: false,
        message: "Error WHile Update profile",
        error,
      });
    }
  };
  
  //orders
  export const getOrdersController = async (req, res) => {
    try {
      const orders = await orderModel
        .find({ buyer: req.user._id })
        .populate("products", "-photo")
        .populate("buyer", "name");
      res.json(orders);
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "Error WHile Geting Orders",
        error,
      });
    }
  };
  //orders
  export const getAllOrdersController = async (req, res) => {
    try {
      const orders = await orderModel
        .find({})
        .populate("products", "-photo")
        .populate("buyer", "name")
        .sort({ createdAt: "-1" });
      res.json(orders);
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "Error WHile Geting Orders",
        error,
      });
    }
  };
  
  //order status
  export const orderStatusController = async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;
      const orders = await orderModel.findByIdAndUpdate(
        orderId,
        { status },
        { new: true }
      );
      res.json(orders);
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "Error While Updateing Order",
        error,
      });
    }
  };