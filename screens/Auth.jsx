import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, Linking, TouchableOpacity, ToastAndroid, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import axios from 'axios';

import * as FileSystem from 'expo-file-system';
import * as LocalAuthentication from 'expo-local-authentication';
import * as MediaLibrary from 'expo-media-library';

import Toast from '@ant-design/react-native/lib/toast';
import Modal from '@ant-design/react-native/lib/modal';
import TextareaItem from '@ant-design/react-native/lib/textarea-item';

import { Ionicons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import {Dimensions} from "react-native";

const {width, height} = Dimensions.get("window");

const Auth = ( { navigation } ) => {

    const codeArr = ['0','1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20'];
    const Directory = FileSystem.documentDirectory + '/employee';
    const File = Directory + '/emp_id.txt';
    const url = 'https://202.63.220.170:3443';

    const [ disabled, setDisabled ] = useState(false);
    const [ isToEnterCode, setIsToEnterCode ] = useState(false);
    const [ WhatsappNumber, setWhatsappNumber ] = useState('');
    const [ Code, setCode ] = useState('');
    const [ code, setOTP ] = useState(codeArr[Math.floor(Math.random() * codeArr.length)]+codeArr[Math.floor(Math.random() * codeArr.length)]+codeArr[Math.floor(Math.random() * codeArr.length)]+codeArr[Math.floor(Math.random() * codeArr.length)]+codeArr[Math.floor(Math.random() * codeArr.length)]+codeArr[Math.floor(Math.random() * codeArr.length)]);
    const [ Password, setPassword ] = useState('');
    const [ View, setView ] = useState(1);
    const [ Validation, setValidation ] = useState(false);
    const [ isBiometricSupported, setIsBiometricSupported ] = useState(false);
    const [ isMediaTrue, setIsMediaTrue ] = useState(false);
    const [ contractual, setContractual ] = useState();

    useEffect(
        () => {
            (
                async () => {
                    if ( isMediaTrue )
                    {
                        const folder = await FileSystem.getInfoAsync(Directory);
        
                        if (!folder.exists) {
                            await FileSystem.makeDirectoryAsync(Directory);
                        }
                    }
                }
            )();
        }, [ isMediaTrue ]
    );
    const authenticate = () => {
        if ( Code.length === 0 )
        {
            Modal.alert(
                'Code is required', 
                'Code Field is currently empty, please enter a valid registration code.', 
                [
                    { text: 'OK', onPress: () => console.log('ok') },
                ]
            );
            return false;
        }
        if ( Password.length === 0 )
        {
            Modal.alert(
                'Password is required', 
                'Password Field is currently empty, please enter a your desired password.', 
                [
                    { text: 'OK', onPress: () => console.log('ok') },
                ]
            );
            return false;
        }
        Toast.loading("Please Wait...");
        setValidation(true);
        if( contractual ) {
            if ( code === Code ) {
                Modal.alert(
                    'Auth Success', 
                    'Your registration process has been completed.',
                    [
                        { text: 'Okay', onPress: () => createTextFile( { name: contractual[0].name, emp_id: contractual[0].temp_emp_id, url: url, password: Password, temp_emp_id: contractual[0].temp_emp_id } ) },
                    ]
                );
            }else {
                setValidation(false);
                Modal.alert(
                    'Code Not Matched', 
                    'The entered code is not matched with the OTP sent on your whatsapp number.', 
                    [
                        { text: 'Try Again', onPress: () => console.log('ok') },
                    ]
                );
            }
        }else {
            axios.post(
                url + '/attendance/auth',
                {
                    id: Code
                }
            ).then(
                res => {
                    setValidation(false);
                    if ( res.data.length > 0 )
                    {
                        if ( res.data[0].attendance_id == Code )
                        {
                            Modal.alert(
                                'Auth Success', 
                                'Your registration process has been completed.',
                                [
                                    { text: 'Okay', onPress: () => createTextFile( { name: res.data[0].name, emp_id: res.data[0].emp_id, url: url, password: Password } ) },
                                ]
                            );
                        }else
                        {
                            Modal.alert(
                                'Code Not Matched', 
                                'The entered code is not matched with the OTP sent on your whatsapp number.', 
                                [
                                    { text: 'Try Again', onPress: () => console.log('ok') },
                                ]
                            );
                        }
                    }else
                    {
                        Modal.alert(
                            'Auth Failed', 
                            'No Record Found', 
                            [
                                { text: 'Try Again', onPress: () => console.log('ok') },
                            ]
                        );
                    }
                }
            ).catch(
                err => {
                    console.log(err);
                    setValidation(false);
                    Toast.offline(err.message)
                }
            );
        }
    }
    const createTextFile = async ( obj ) => {
        setTimeout(() => {
            setView(1);
        }, 1000);
        await FileSystem.writeAsStringAsync(File, JSON.stringify(obj), { encoding: FileSystem.EncodingType.UTF8 });
        const asset = await MediaLibrary.createAssetAsync(File)
        await MediaLibrary.createAlbumAsync("Download", asset, false);
        console.log('success: ', asset);
    }
    // const decrypt = (salt, encoded) => {
    //     if (salt !== null && encoded !== null) {
    //         const textToChars = (text) => text.split("").map((c) => c.charCodeAt(0));
    //         const applySaltToChar = (code) => textToChars(salt).reduce((a, b) => a ^ b, code);
    //         return encoded
    //             .match(/.{1,2}/g)
    //             .map((hex) => parseInt(hex, 16))
    //             .map(applySaltToChar)
    //             .map((charCode) => String.fromCharCode(charCode))
    //             .join("");
    //     } else {
    //         return null;
    //     }
    // };
    
    // const crypt = (salt, text) => {
    //     const textToChars = (text) => text.split("").map((c) => c.charCodeAt(0));
    //     const byteHex = (n) => ("0" + Number(n).toString(16)).substr(-2);
    //     const applySaltToChar = (code) => textToChars(salt).reduce((a, b) => a ^ b, code);

    //     return text
    //         .split("")
    //         .map(textToChars)
    //         .map(applySaltToChar)
    //         .map(byteHex)
    //         .join("");
    // };
    const biometricAuth = () => {

        if ( isBiometricSupported )
        {
            FileSystem.readAsStringAsync(
                File,
                { encoding: FileSystem.EncodingType.UTF8 }
            ).then(
                data => {
                    const JSONData = JSON.parse(data);
                    if ( !isNaN(parseInt(JSONData.emp_id)) )
                    {
                        handleBiometricAuth( JSONData );
                    }else
                    {
                        Toast.loading("Invalid data");
                        console.log("Invalid data");
                        registerYourself();
                    }
                }
            ).catch(
                () => {
                    console.log("No File Found");
                    setView(2);
                }
            );
        }else
        {
            FileSystem.readAsStringAsync(
                File,
                { encoding: FileSystem.EncodingType.UTF8 }
            ).then(
                data => {
                    const JSONData = JSON.parse(data);
                    if ( !isNaN(parseInt(JSONData.emp_id)) )
                    {
                        handlePasswordAuth( JSONData );
                    }else
                    {
                        Toast.loading("Invalid data");
                        console.log("Invalid data");
                        registerYourself();
                    }
                }
            ).catch(
                () => {
                    console.log("No File Found");
                    setView(2);
                }
            );
        }

    }
    const handleBiometricAuth = async ( JSONData ) => {
        const savedBiometrics = await LocalAuthentication.getEnrolledLevelAsync();
        if ( !savedBiometrics ) {
            Modal.alert(
                "No Registered Fingerprints Found",
                'Your device has no Fingerprints.',
                [
                    { text: 'Open Settings', onPress: () => Linking.openSettings() },
                ]
            );
        }else {
            const results = await LocalAuthentication.authenticateAsync();
            if (results.success) {
                navigation.navigate('Operations', { name: JSONData.name, emp_id: JSONData.emp_id, url: url, temp_emp_id: JSONData.temp_emp_id ? JSONData.temp_emp_id : "NaN" });
                ToastAndroid.show("Login Success", ToastAndroid.SHORT, ToastAndroid.TOP);
            }else {
                Toast.fail('Error occurred');
            }
        }
    }
    const handlePasswordAuth = async ( JSONData ) => {
        if ( parseInt(Password) === parseInt(JSONData.password) )
        {
            setPassword('');
            navigation.navigate('Operations', { name: JSONData.name, emp_id: JSONData.emp_id, url: url });
            ToastAndroid.show("Login Success", ToastAndroid.SHORT);
        }else
        {
            Modal.alert(
                'Password Not Matched',
                'Could not recognized the user identity.',
                [
                    { text: 'Okay', onPress: () => console.log('Could not recognized the user identity.') },
                ]
            );
        }
    }
    const registerYourself = async () => {

        if ( isMediaTrue )
        {
            const fileExists = await FileSystem.getInfoAsync(File);
            if ( fileExists.exists )
            {
                await FileSystem.deleteAsync(File);
                console.log("File deleted successfully");
            }
            setView(2);
        }

    }
    const getCode = (otp) => {
        setDisabled(true);
        Toast.loading("Please Wait...");
        axios.post(
            url + '/attendance/get_code',
            {
                number: '92' + WhatsappNumber,
                otp: typeof(otp) === 'string' ? otp : "NO_OTP"
            }
        ).then(
            res => {
                setDisabled(false);
                if (res.data === 'nothing_found')
                {
                    Modal.alert(
                        'No Record Found', 
                        "Couldn't find your whatsapp number, if you're on contract. Please select 'Contractual' option from following.", 
                        [
                            { text: 'Contractual', onPress: () => getCode(code) },
                            { text: 'Try Again', onPress: () => console.log('ok') },
                        ]
                    );
                }else if (res.data === 'still_nothing_found')
                {
                    Modal.alert(
                        'No Record Found', 
                        "Sorry to say but still couldn't find your whatsapp number.", 
                        [
                            { text: 'Try Again', onPress: () => getCode(code)},
                            { text: 'Close', onPress: () => console.log('close')},
                        ]
                    );
                }else if ( res.data === 'success' || res.data[0].message === 'c_success' )
                {
                    if (res.data[0].message === 'c_success') setContractual(res.data);
                    Modal.alert(
                        'Code Sent', 
                        'OTP has been sent to your entered whatsapp number, please check.', 
                        [
                            { text: 'Close', onPress: () => setIsToEnterCode(true) },
                        ]
                    );
                }
            }
        ).catch(
            err => {
                setDisabled(false);
                console.log(err);
                setValidation(false);
                Toast.offline(err.message);
            }
        );

    }

    return (
        <>
            {
                View === 1
                ?
                <FirstView 
                    isBiometricSupported={ isBiometricSupported }
                    Password={ Password }
                    disabled={disabled}

                    setPassword={ setPassword }
                    biometricAuth={ biometricAuth }
                    registerYourself={ registerYourself }
                    setIsBiometricSupported={ setIsBiometricSupported }
                    setIsMediaTrue={ setIsMediaTrue }
                />
                :
                View === 2
                ?
                <Registration 
                    url={ url }
                    WhatsappNumber={ WhatsappNumber }
                    Validation={ Validation }
                    setWhatsappNumber={ setWhatsappNumber }
                    authenticate={ authenticate }
                    isToEnterCode={ isToEnterCode }
                    setCode={ setCode }
                    Code={ Code }
                    Password={ Password }
                    setPassword={ setPassword }
                    getCode={ getCode }
                    disabled={disabled}
                />
                :null
            }
        </>
    );

}

export default Auth;

const FirstView = ( { disabled, Password, setPassword, isBiometricSupported, biometricAuth, registerYourself, setIsBiometricSupported, setIsMediaTrue } ) => {

    useEffect(
        () => {
            (
                async () => {
                    const mediaPermission = await MediaLibrary.requestPermissionsAsync();
                    const compatible = await LocalAuthentication.hasHardwareAsync();
                    setIsBiometricSupported(compatible);
                    setIsMediaTrue(mediaPermission.granted);
                }
            )();
        }, []
    );

    useEffect(
        () => {
            if ( isBiometricSupported )
            {
                biometricAuth();
            }
        }, [ isBiometricSupported ]
    )

    return (
        <>
            <View style={ styles.container }>
                <View style={{ flex: 7 }}>
                    <Text style={styles.title}>SEABOARD</Text>
                    <Text style={{ color: '#898989', marginBottom: 50, textAlign: 'center' }}>Powered By Seatech</Text>
                    <View style={{ alignItems: 'center', display: 'flex' }}>
                        <Feather name="unlock" size={50} color="#fff" />
                    </View>
                </View>
                {
                    isBiometricSupported
                    ?
                    <View style={{ position: 'relative', borderColor: '#4385F5', borderWidth: 5, borderRadius: 30, justifyContent: 'center', flex: 10 }}>

                        <View>
                            <TouchableOpacity onPress={ biometricAuth } style={ styles.biometricBtn }>
                                <Ionicons name="finger-print-outline" size={120} color="#4385F5" />
                            </TouchableOpacity>
                        </View>
                        <View style={{ position: 'absolute', top: -10, left: '10%', padding: 10, width: '80%', backgroundColor: '#202124' }}></View>
                        <View style={{ position: 'absolute', bottom: -10, left: '10%', padding: 10, width: '80%', backgroundColor: '#202124' }}></View>
                        
                        <View style={{ position: 'absolute', top: '15%', right: -5, width: 10, height: '70%', backgroundColor: '#202124' }}></View>
                        <View style={{ position: 'absolute', top: '15%', left: -5, width: 10, height: '70%', backgroundColor: '#202124' }}></View>

                    </View>
                    :
                    <View style={{ position: 'relative', borderColor: '#4385F5', borderWidth: 5, borderRadius: 30, padding: 20, flex: 10 }}>
                        <Text style={{ color: "#fff" }}>Password</Text>
                        <TextareaItem
                            style={styles.input}
                            secureTextEntry
                            value={Password}
                            onChangeText={(id) => setPassword(id)}
                            keyboardType='numeric'
                            disabled={disabled}
                        />
                        <TouchableOpacity disabled={disabled} onPress={ biometricAuth } style={{ marginTop: 10, padding: 15, borderColor: '#fff', borderWidth: 1, borderRadius: 20 }}>
                            <Text style={{ color: '#fff', textAlign: 'center' }}>Login</Text>
                        </TouchableOpacity>
                    </View>
                }
                <TouchableOpacity disabled={disabled} onLongPress={ registerYourself } style={ [ styles.biometricBtn, { flex: 2, justifyContent: 'center' } ] }>
                    <Text style={{ textAlign: 'center', color: "#898989", backgroundColor: "rgba(255,255,255, 0.1)", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 }}>Register Yourself</Text>
                </TouchableOpacity>
                {/* url + "/assets/attendance_app_icon.png" */}
            </View>
        </>
    )

}

const Registration = ( { disabled, Password, setPassword, isToEnterCode, url, WhatsappNumber, Validation, setWhatsappNumber, authenticate, Code, getCode, setCode } ) => {

    const setUserWhatsapp = ( num ) => {

        if ( num.length <= 10 )
        {
            setWhatsappNumber(num);
        }

    }

    return (
        <>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} enabled={false}>
                <ScrollView style={ styles.container }>
                    <View style={{ flex: 1, paddingBottom: 50 }}>
                        <Text style={styles.title}>SEABOARD</Text>
                        <Text style={{ color: '#898989', marginBottom: 50, textAlign: 'center' }}>Register Yourself</Text>
                        <View style={{ alignItems: 'center', display: 'flex' }}>
                            <FontAwesome name="user-o" size={50} color="#fff" />
                        </View>
                    </View>
                    {
                        isToEnterCode
                        ?
                        <View style={{ flex: 2 }}>
                            <Text style={{ fontSize: 15, color: "#898989" }}>OTP</Text>
                            <TextareaItem
                                style={[styles.input, {borderRadius: 10}]}
                                value={Code}
                                onChangeText={(id) => setCode(id)}
                                placeholder='Like. 123456'
                                keyboardType='numeric'
                                disabled={disabled}
                            />
                            <Text style={{ color: "#898989", marginTop: 10 }}>Set Password</Text>
                            <TextareaItem
                                style={[styles.input, {borderRadius: 10}]}
                                secureTextEntry
                                value={Password}
                                onChangeText={(id) => setPassword(id)}
                                keyboardType='numeric'
                                disabled={disabled}
                            />
                            <TouchableOpacity disabled={ Validation } onPress={ authenticate } style={{ marginTop: 10, padding: 15, borderColor: '#fff', borderWidth: 1, borderRadius: 20 }}>
                                <Text style={{ color: '#fff', textAlign: 'center' }}>Confirm</Text>
                            </TouchableOpacity>
                        </View>
                        :
                        <View style={{ flex: 2 }}>
                            <Text style={{ fontSize: 15, color: "#898989", textAlign: "center" }}>Your Whatsapp Number</Text>
                            <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'center' }}>
                                <TextareaItem
                                    style={[styles.input, { paddingRight: 10, borderTopLeftRadius: 10, borderBottomLeftRadius: 10 }]}
                                    value='92'
                                    keyboardType='numeric'
                                    disabled={ true }
                                />
                                <TextareaItem
                                    style={[styles.input, { paddingRight: 10, width: width * 0.7, borderTopRightRadius: 10, borderBottomRightRadius: 10 }]}
                                    value={WhatsappNumber}
                                    onChangeText={(id) => setUserWhatsapp(id)}
                                    placeholder='3305677890'
                                    keyboardType='numeric'
                                    maxLength={10}
                                    disabled={disabled}
                                />
                            </View>
                            <TouchableOpacity disabled={disabled} onPress={ getCode } style={{ marginTop: 20, padding: 15, borderColor: '#fff', borderWidth: 1, borderRadius: 20, width: width * 0.8, alignSelf: "center" }}>
                                <Text style={{ color: '#fff', textAlign: 'center' }}>Get Code</Text>
                            </TouchableOpacity>
                        </View>
                    }
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    )

}

const styles = StyleSheet.create(
    {
        title: {
            fontSize: 30,
            textAlign: 'center',
            letterSpacing: 10,
            fontFamily: 'cinzel',
            color: "#fff"
        },
        container: {
            flex: 1,
            padding: 15,
            paddingTop: 100,
            backgroundColor: '#202124'
        },
        input: {
            height: 44,
            padding: 10,
            marginVertical: 10,
        },
        biometricBtn: {
            alignItems: 'center'
        }
    }
)