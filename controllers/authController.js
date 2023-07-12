import { comparePassword, hashPassword } from "./helpers/authHelper.js";
import userModel from "./models/userModel.js"
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

//test controller
export const testController = (req,res) =>{
    try{
    res.send("Protected Routes");
    } catch (error) {
        console.log(error);
        res.send({error});
    }
};