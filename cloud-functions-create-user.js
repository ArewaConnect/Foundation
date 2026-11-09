const {onCall,HttpsError}=require("firebase-functions/v2/https");
const {initializeApp}=require("firebase-admin/app");
const {getAuth}=require("firebase-admin/auth");
const {getFirestore,FieldValue}=require("firebase-admin/firestore");
initializeApp(); const db=getFirestore();
exports.createFoundationUser=onCall(async req=>{
 if(!req.auth||req.auth.token.superAdmin!==true)throw new HttpsError("permission-denied","Super Admin only.");
 const {username,email,password,role,permissions}=req.data||{};
 const roles=["Founder","Registration Agent"],pages=["founder-dashboard","members-record","registration","admin-dashboard"];
 if(typeof username!=="string"||username.trim().length<3||typeof email!=="string"||!email.includes("@")||typeof password!=="string"||password.length<8||!roles.includes(role)||!Array.isArray(permissions)||permissions.some(p=>!pages.includes(p)))throw new HttpsError("invalid-argument","Invalid account details.");
 const uname=username.trim().toLowerCase(),unameRef=db.collection("usernames").doc(uname);
 if((await unameRef.get()).exists)throw new HttpsError("already-exists","Username already exists.");
 const user=await getAuth().createUser({email:email.trim(),password,displayName:username.trim()});
 await getAuth().setCustomUserClaims(user.uid,{role,permissions,superAdmin:false});
 const batch=db.batch();batch.set(unameRef,{uid:user.uid,createdAt:FieldValue.serverTimestamp()});
 batch.set(db.collection("userAccounts").doc(user.uid),{uid:user.uid,username:username.trim(),usernameLower:uname,email:email.trim(),role,permissions,active:true,createdBy:req.auth.uid,createdAt:FieldValue.serverTimestamp()});
 await batch.commit();return {uid:user.uid};
});