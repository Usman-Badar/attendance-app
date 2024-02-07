import React, { useEffect, useRef, useState } from 'react';
import MapView, { Circle, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Vibration, ScrollView, Text, Image, View, TouchableOpacity, Animated, Alert } from 'react-native';

import * as FileSystem from 'expo-file-system';
import { AntDesign, SimpleLineIcons, Entypo } from '@expo/vector-icons';

import Modal from '@ant-design/react-native/lib/modal';
import TextareaItem from '@ant-design/react-native/lib/textarea-item';
import Radio from '@ant-design/react-native/lib/radio';
import axios from 'axios';
import * as Speech from 'expo-speech';
import {Dimensions} from "react-native";
import { Platform, NativeModules } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Avatar } from 'react-native-paper';
import Loader from 'react-native-modal-loader';
import { RFPercentage } from 'react-native-responsive-fontsize';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
const { StatusBarManager } = NativeModules;

const {width, height} = Dimensions.get("window");

const Operations = ( { route, navigation } ) => {

  const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 20 : StatusBarManager.HEIGHT;
  const LocationsDirectory = FileSystem.documentDirectory + '/locations';
  const LocationsFile = LocationsDirectory + '/locations.txt';
  const AttendanceDirectory = FileSystem.documentDirectory + '/attendance';
  const AttendanceFile = AttendanceDirectory + '/attendance.txt';

  const alertOpacity = useRef(new Animated.Value(0)).current;
  const alertTop = useRef(new Animated.Value(100)).current;
  const api = axios.create({timeout: 10000});
  const { name, emp_id, url, temp_emp_id } = route.params;

  const [ loadingState, setLoadingState ] = useState(false);
  const [ LocationID, setLocationID ] = useState(
    {
      index: undefined,
      location_code: undefined,
      location_name: "",
      location_address: "",
      latitude: undefined,
      longitude: undefined
    }
  );
  const [ Category, setCategory ] = useState();
  const [ DataPendingForUpdate, setDataPendingForUpdate ] = useState(false);
  const [ Reason, setReason ] = useState('');
  const [ MarkFor, setMarkFor ] = useState();
  const [ SubmitTo, setSubmitTo ] = useState();
  const [ Distance, setDistance ] = useState();
  const [ Locations, setLocations ] = useState([]);
  const [ Relations, setRelations ] = useState([]);
  const [ ConfirmingRequest, setConfirmingRequest ] = useState(false);
  const [ SelectingLocation, setSelectingLocation ] = useState(false);
  const [ openAttMenu, setOpenAttMenu ] = useState(false);
  const [ StartShift, setStartShift ] = useState(true);
	const [ PermissionStatus, setPermissionStatus ] = useState('');
  const [ Position, setPosition ] = useState(
    {
      lat: 0,
      long: 0
    }
  );

  useEffect(
    () => {
      setSelectingLocation(false);
    }, [ LocationID ]
  );
  useEffect(
    () => {
      if(Distance && Distance > 0.5) {
        Animated.timing(alertOpacity, {toValue: 1, duration: 500, useNativeDriver: false}).start();
        Animated.timing(alertTop, {toValue: 110, duration: 500, useNativeDriver: false}).start();
      }else if (alertOpacity != 0) {
        Animated.timing(alertOpacity, {toValue: 0, duration: 500, useNativeDriver: false}).start();
        Animated.timing(alertTop, {toValue: 100, duration: 500, useNativeDriver: false}).start();
      }
    }, [Distance]
  )
  useEffect(
    () => {
      if ( LocationID.latitude && LocationID.longitude ) setDistance(calcCrow(Position.lat, Position.long, parseFloat(LocationID.latitude), parseFloat(LocationID.longitude)));
    }, [ LocationID, Position.lat, Position.long ]
  );
  useEffect(
    () => {
      async function requestPermission()
      {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setPermissionStatus('Permission to access location was denied');
          return;
        }
        getCoordinates();
        checkLocationSaved();
        FetchAttendance( emp_id, url, temp_emp_id );
        
        const folder = await FileSystem.getInfoAsync(AttendanceDirectory);
        if (!folder.exists) {
          await FileSystem.makeDirectoryAsync(AttendanceDirectory);
          await FileSystem.writeAsStringAsync(AttendanceFile, JSON.stringify([]), { encoding: FileSystem.EncodingType.UTF8 });
        }else {
          FileSystem.readAsStringAsync(AttendanceFile, { encoding: FileSystem.EncodingType.UTF8 }).then(data => {
            const parsed_data = JSON.parse(data);
            if (parsed_data.length > 0) setDataPendingForUpdate(true);
          })
        }
        // api.get(`${url}/testing`).then(res => {
        //   if (res.data === 'success') {
        //     FetchAttendance( emp_id, url, temp_emp_id );
        //     setOnline(true);
        //   }
        // }).catch(() => {
        //   Toast.offline("Seems like server is offline.");
        //   setOnline(false);
        // })
      }
      requestPermission();
    }, []
  );

  // async function checkLocationSaved() {
  //   const folder = await FileSystem.getInfoAsync(LocationsDirectory);
  //   const file = await FileSystem.getInfoAsync(LocationsFile);
  //   if (!folder.exists) await FileSystem.makeDirectoryAsync(LocationsDirectory);
  //   if (file.exists) {
  //     FileSystem.readAsStringAsync(LocationsFile, { encoding: FileSystem.EncodingType.UTF8 }).then(data => {
  //       const parsed_data = JSON.parse(data);
  //       setLocations(parsed_data);
  //     })
  //   }else {
  //     api.get(url + '/getalllocations').then(res => {
  //       saveLocations(res.data);
  //     });
  //     async function saveLocations(data) {
  //       await FileSystem.writeAsStringAsync(LocationsFile, JSON.stringify(data), { encoding: FileSystem.EncodingType.UTF8 });
  //       setLocations(data);
  //     }
  //   }
  // }
  async function checkLocationSaved() {
    api.get(url + '/getalllocations').then(res => {
      setLocations(res.data);
      // saveLocations(res.data);
    }).catch(() => checkLocationSaved());
    // async function saveLocations(data) {
    //   await FileSystem.writeAsStringAsync(LocationsFile, JSON.stringify(data), { encoding: FileSystem.EncodingType.UTF8 });
    //   setLocations(data);
    // }
  }
  async function getCoordinates() {
    setLoadingState(true);
    await Location.watchPositionAsync({accuracy: Location.Accuracy.High, timeInterval: 1000, distanceInterval: 1}, ({ coords }) => {
      setPosition({lat: coords.latitude, long: coords.longitude});
      setLoadingState(false);
      // setTimeout(() => {
      //   if(Position.lat === 0 || Position.long === 0) reload();
      // }, 3000);
    });
  }
  function calcCrow(lat1, lon1, lat2, lon2) {
    var R = 6371; // km
    var dLat = toRad(lat2 - lat1);
    var dLon = toRad(lon2 - lon1);
    var lat1 = toRad(lat1);
    var lat2 = toRad(lat2);

    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d;
  }
  function toRad(Value) {
    return Value * Math.PI / 180;
  }
  const FetchAttendance = (id, ip, temp_emp_id) => {
    const host = ip;
    setLoadingState(true);
    api.post(`${host}/gettodaysattstate`, { empID: id, temp_emp_id: temp_emp_id }).then(res => {
      const attendance = res.data[0];
      const category = res.data[1];
      if (attendance[0] === undefined || attendance[0].time_in === null) {
        setStartShift(true);
      }else {
        setStartShift(false);
      }
      setCategory(category);
      setLoadingState(false);
    }).catch(err => {
      console.log(err);
      FetchAttendance(id, ip, temp_emp_id)
    });
  }
  const TimeIn = () => {

    if (!LocationID.location_code) {
      Alert.alert('No Location Found', 'First you have to select a location, then you can in/out your shift.');
      setSelectingLocation(true);
      setOpenAttMenu(false);
      return false;
    }else if (Position.lat === 0 || Position.long === 0) {
      Alert.alert('Validation Error', "Couldn't find your location, it seems like you've turned off your location.");
      return false;
    }

    setMarkFor("IN");
    if ( Distance && Distance < 0.5 )
    {
      const location_code = LocationID.location_code;
      setLoadingState(true);
      // saveIntoFile();
      setLocationID(
        {
          ...LocationID,
          index: null,
          location_code: undefined
        }
      );
      // saveIntoFile(emp_id, JSON.stringify(Position), location_code, 'IN');
      api.post(
        url + '/attendance_request/mark_thumb',
        {
          empID: emp_id,
          position: JSON.stringify(Position),
          location_code: location_code
        }
      ).then(
        () => {
          api.post(
            url + '/timein',
            {
              empID: emp_id,
              temp_emp_id: temp_emp_id
            }
          ).then(
            async (res) => {
              setLoadingState(false);
              if (res.data === 'success') {
                Speech.speak("Shift Started");
                Modal.alert(
                    'Time In Marked', 
                    'You can check your attendance online, your time in has been marked.', 
                    [
                        { text: 'Thank You', onPress: () => navigation.navigate('Auth', { url: url }) },
                    ]
                );
              }else {
                err()
              }
            }
          ).catch(() => err());;
        }
      ).catch(() => err());

      async function err() {
        const { sound } = await Audio.Sound.createAsync(
          require("../assets/audio/sound.wav")
        );
        await sound.playAsync();
        Vibration.vibrate(1 * 1000);
        Modal.alert(
          'Failed',
          'Could not start your shift.',
          [
            { text: 'Retry' },
          ]
        );
      }
    }else
    {
      AttendanceRequest(); 
    }
    
  }
  const TimeOut = () => {

    if (!LocationID.location_code) {
      Alert.alert('No Location Found', 'First you have to select a location, then you can in/out your shift.');
      setSelectingLocation(true);
      setOpenAttMenu(false);
      return false;
    }else if (Position.lat === 0 || Position.long === 0) {
      Alert.alert('Validation Error', "Couldn't find your location, it seems like you've turned off your location.");
      return false;
    }

    setMarkFor("OUT");
    if ( Distance && Distance < 0.5 )
    {
      const location_code = LocationID.location_code;
      setLoadingState(true);
      setLocationID(
        {
          ...LocationID,
          index: null,
          location_code: undefined
        }
      )
      // saveIntoFile(emp_id, JSON.stringify(Position), location_code, 'OUT');
      api.post(
        url + '/attendance_request/mark_thumb',
        {
          empID: emp_id,
          position: JSON.stringify(Position),
          location_code: location_code
        }
      ).then(
        () => {
          api.post(
            url + '/timeout',
            {
              empID: emp_id,
              temp_emp_id: temp_emp_id
            }
          ).then(
            async (res) => {
              setLoadingState(false);
              if (res.data === 'success') {
                Speech.speak("Shift Ended");
                Modal.alert(
                    'Time Out Marked', 
                    'You can check your attendance online, your time out has been marked.', 
                    [
                        { text: 'Thank You', onPress: () => navigation.navigate('Auth', { url: url }) },
                    ]
                );
              }else {
                const { sound } = await Audio.Sound.createAsync(
                  require("../assets/audio/sound.wav")
                );
                await sound.playAsync();
                Vibration.vibrate(1 * 1000);
                Modal.alert(
                  'Failed', 
                  'Could not end your shift.', 
                  [
                      { text: 'Retry' },
                  ]
              );
              }
            }
          );
        }
      );
    }else
    {
      AttendanceRequest(); 
    }
    
  }
  const submitAttRequest = () => {

    const submit_to = SubmitTo;
    const reason = Reason;
    setSubmitTo();
    setReason('');

    setLoadingState(true);
    api.create({timeout: 2000}).post(
      url + '/attendance_request/submit',
      {
        empID: emp_id,
        submit_to: submit_to,
        reason: reason,
        position: JSON.stringify(Position),
        location: JSON.stringify(LocationID),
        in_out: MarkFor,
        distance: Distance
      }
    ).then(
      () => {
        setLoadingState(false);
        Modal.alert(
            'Request Sent', 
            'Your attendance request has been sent to your H.O.D. Please wait for the response.', 
            [
                { text: 'OK', onPress: () => navigation.navigate('Auth', { url: url }) },
            ]
        );
      }
    ).catch(err => {
      console.log(err);
      setLoadingState(false);
    });

  }
  const AttendanceRequest = () => {
    if (temp_emp_id === 'NaN' || isNaN(parseInt(temp_emp_id))) {
      api.post(
        url + '/get_employee_sr',
        {
          empID: emp_id
        }
      ).then(
        res => {
          setRelations(res.data);
          setConfirmingRequest(true);
        }
      );
    }else {
      Modal.alert(
          'Access Denied', 
          "You are not allowed to send attendance requests, as you're not our regular employee.", 
          [
              { text: 'Okay', onPress: () => console.log("okay") },
          ]
      );
    }
  }
  const reload = () => {
    FetchAttendance( emp_id, url, temp_emp_id );
    checkLocationSaved();
    // setPosition({lat: 0, long: 0});
  }
  async function saveIntoFile(emp_id, position, location_code, type) {
    FileSystem.readAsStringAsync(AttendanceFile, { encoding: FileSystem.EncodingType.UTF8 }).then(data => {
      const parsed_data = JSON.parse(data);
      parsed_data.push({
        emp_id: emp_id,
        position: position,
        location_code: location_code,
        type: type
      });
      FileSystem.writeAsStringAsync(AttendanceFile, JSON.stringify(parsed_data), { encoding: FileSystem.EncodingType.UTF8 }).then(() => {
        const title = type === 'IN' ? 'Time In Noted' : 'Time Out Noted';
        Modal.alert(
          title, 
            "Your time has been noted but not updated on live yet, if you want to update on live, please click 'Update'.", 
            [
              { text: 'Close' },
              { text: 'Update', onPress: () => navigation.navigate('Auth', { url: url }) },
            ]
        );
      });
    })
  }
  if ( ConfirmingRequest )
  {
    return (
      <KeyboardAwareScrollView>
        <View style={{height: height, marginTop: STATUSBAR_HEIGHT }}>
          <ScrollView style={{ padding: 10, paddingTop: 30, backgroundColor: '#202124', height: height * 0.5}} automaticallyAdjustKeyboardInsets={true} showsVerticalScrollIndicator={false}>
            <Text style={{ fontSize: 15, textAlign: "center", color: "#fff" }}>Attendance Request : Time {MarkFor}</Text>
            <View style={{alignSelf: "center", width: "90%", height: 1, backgroundColor: "#fff", marginVertical: 5}}></View>
            <View style={{alignSelf: "center", width: "70%", height: 1, backgroundColor: "#fff", marginVertical: 5}}></View>
            <View style={{alignSelf: "center", width: "50%", height: 1, backgroundColor: "#fff", marginVertical: 5}}></View>
            <Text style={{ marginVertical: 10, color: "#fff", textAlign: "center" }}>All the following fields are required.</Text>
            <View style={{ backgroundColor: "rgba(255, 255, 255, 0.7)", paddingVertical: 10, paddingHorizontal: 20, marginBottom: 15, borderRadius: 10 }}>
              <Text style={{textAlign: 'justify', fontSize: 12}}>If you're in the location and still you're seeing option to send attendance request, kindly turn off and on your location and restart the application.</Text>
            </View>
            
            <Text style={{ marginBottom: 0, marginLeft: 5, fontWeight: 'bold', color: "#fff" }}>Submit To</Text>
            {
              Relations.length === 0
              ?
              <Text style={{ marginBottom: 0, textAlign: 'center', color: "rgb(233, 154, 40)", backgroundColor: 'rgba(233, 154, 40, .2)', paddingVertical: 15, borderRadius: 5, marginTop: 10 }}>No Superior Found</Text>
              :
              Relations.map(
                ( val, index ) => {
                  return (
                    <Radio style={{ marginVertical: 10 }} onChange={ () => setSubmitTo( val.sr ) } checked={ SubmitTo ? SubmitTo === val.sr : false } key={ index }>
                      <Text style={{color: "#fff"}}>{ val.name }</Text>
                    </Radio>
                  )
                }
              )
            }

            <Text style={{ marginTop: 10, marginBottom: 5, marginLeft: 5, fontWeight: 'bold', color: "#fff" }}>Reason</Text>
            <TextareaItem
              rows={4}
              placeholder="Enter Your Reason"
              autoHeight
              style={{ paddingTop: 10, borderRadius: 5, fontSize: 15, height: 70 }}
              onChangeText={ ( text ) => setReason(text) }
            />
            <Text style={{ marginBottom: 5, marginLeft: 5, color: "#fff" }}>{Reason.trim().length}/20</Text>

            {
              SubmitTo && Reason.trim().length >= 20
              ?
              <TouchableOpacity onPress={ submitAttRequest } style={{ zIndex: 1, marginTop: 15, backgroundColor: '#fff', width: '100%', padding: 10, borderRadius: 5 }}>
                <Text style={{ color: '#000', textAlign: 'center', fontSize: 13 }}>Submit</Text>
              </TouchableOpacity>
              :null
            }
            <TouchableOpacity onPress={ () => setConfirmingRequest() } style={{ backgroundColor: '#898989', width: '100%', padding: 10, borderRadius: 5, marginTop: 15, zIndex: 1 }}>
              <Text style={{ color: '#fff', textAlign: 'center', fontSize: 13 }}>Close</Text>
            </TouchableOpacity>
            <View style={{height: height * 0.2}}></View>
          </ScrollView>
        </View>
      </KeyboardAwareScrollView>
    )
  }
  
  if ( PermissionStatus.length > 0 ) {
    return (
      <>
        <Text>Access Denied</Text>
      </>
    )
  }

  return (
    <>
      <Loader loading={loadingState} color="#898989" size={'large'} />
      {
        LocationID.location_code
        ?
        <View style={{padding: 10, width: '100%', position: 'absolute', top: 30, left: 0, zIndex: 1, flexDirection: 'row', justifyContent: 'center'}}>
          <Text style={{backgroundColor: '#898989', color: '#fff', paddingVertical: 2, paddingHorizontal: 10, borderRadius: 5}}>{LocationID.location_name}</Text>
        </View>
        :null
      }
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', width: '100%', bottom: 0, zIndex: 1, position: 'absolute' }}>
        <TouchableOpacity onPress={ () => setOpenAttMenu(!openAttMenu) } style={{ width: '25%', padding: 15, alignItems: 'center', position: 'relative' }}>
          {DataPendingForUpdate?<View style={{top: 3, right: -10, width: 8, height: 8, borderRadius: 10, backgroundColor: 'red'}}></View>:null}
          <AntDesign name="earth" size={24} color="black" />
          <Text style={{ textAlign: 'center', fontSize: 10 }}>Mark</Text>
        </TouchableOpacity>
        {/* {
          StartShift
          ?
          <TouchableOpacity onPress={TimeIn} style={{ width: '25%', padding: 15, alignItems: 'center' }}>
            <MaterialCommunityIcons name="account-clock" size={24} color="black" />
            <Text style={{ textAlign: 'center', fontSize: 10 }}>Start</Text>
          </TouchableOpacity>
          :
          <TouchableOpacity onPress={TimeOut} style={{ width: '25%', padding: 15, alignItems: 'center' }}>
            <MaterialCommunityIcons name="clock-alert" size={24} color="black" />
            <Text style={{ textAlign: 'center', fontSize: 10 }}>End</Text>
          </TouchableOpacity>
        } */}
        <TouchableOpacity onPress={ () => setSelectingLocation(!SelectingLocation) } style={{ width: '25%', padding: 15, alignItems: 'center' }}>
          <Entypo name="location" size={24} color="black" />
          <Text style={{ textAlign: 'center', fontSize: 10 }}>Location</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={reload} style={{ width: '25%', padding: 15, alignItems: 'center' }}>
          <SimpleLineIcons name="reload" size={24} color="black" />
          <Text style={{ textAlign: 'center', fontSize: 10 }}>Reload</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ width: '25%', padding: 15, alignItems: 'center', position: 'relative' }}>
          <Avatar.Text
            style={{backgroundColor: '#898989'}}
            label={name.substring(0,1)}
            color={'#ffffff'}
            size={40}
          />
        </TouchableOpacity>
      </View>
      {
        Position.lat !== 0 && Position.long !== 0
        ?
        <MapView
          style={{ flex: 1 }}
          initialRegion={{
            latitude: Position.lat,
            longitude: Position.long,
            latitudeDelta: 0.0622,
            longitudeDelta: 0.0121,
          }}
          loadingEnabled
          mapType='hybrid'
          userInterfaceStyle="dark"
          userLocationPriority="high"
          >
          {
            LocationID.latitude && LocationID.longitude && (
              <>
                <Marker
                  key={ 1 }
                  coordinate={{
                    latitude: parseFloat(LocationID.latitude),
                    longitude: parseFloat(LocationID.longitude),
                  }}    
                  title={LocationID.location_name}
                  description={ LocationID.location_address }
                >
                  {/* <Image source={require('../assets/home.png')} style={{height: 40, width: 40 }} /> */}
                </Marker>
                <Circle
                  center={{
                    latitude: parseFloat(LocationID.latitude),
                    longitude: parseFloat(LocationID.longitude),
                  }}
                  strokeColor={'#000'}
                  strokeWidth={2}
                  fillColor={ 'rgba(37, 55, 84, 0.2)' }
                  radius={500}
                />
              </>
            )
          }
          <Marker
            key={ 0 }
            coordinate={{
              latitude: Position.lat,
              longitude: Position.long,
            }}
            title={name}
            description={"You"}
            // image={{uri: 'https://i.ibb.co/0tsmC3F/208-2088909-professional-employee-png-transparent-png-download.png'}}
          >
            {/* <Image source={require('../assets/pin.png')} style={{height: 40, width: 40 }} /> */}
          </Marker>
        </MapView>
        :null
      }
      {
        openAttMenu && !SelectingLocation && (
          <>
            <ScrollView style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 2, position: 'absolute', top: 0, left: 0, width: width, height: height * 0.955 }} showsVerticalScrollIndicator={false}>
              {
                !Category
                ?<View style={{alignItems: 'center', justifyContent: 'space-around', width: width, height: height * 0.955}}><Text style={{color: '#fff', fontSize: RFPercentage(3)}}>Loading...</Text></View>:
                Category[0]?.att_category !== 'General'
                ?
                <View style={{alignItems: 'center', justifyContent: 'space-around', width: width, height: height * 0.955}}>
                  <TouchableOpacity onPress={TimeIn} style={{width: width, alignItems: 'center'}}>
                    <Ionicons name="timer-outline" size={RFPercentage(12)} color="white" />
                    <Text style={{ color: '#fff', fontSize: RFPercentage(3) }}>
                      Start Shift
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={TimeOut} style={{width: width, alignItems: 'center'}}>
                    <MaterialCommunityIcons name="clock-time-one" size={RFPercentage(12)} color="white" />
                    <Text style={{ color: '#fff', fontSize: RFPercentage(3) }}>
                      Shift End
                    </Text>
                  </TouchableOpacity>
                </View>
                :
                <View style={{alignItems: 'center', justifyContent: 'space-around', width: width, height: height * 0.955}}>
                  {
                    StartShift
                    ?
                    <TouchableOpacity onPress={TimeIn} style={{width: width, alignItems: 'center'}}>
                      <Ionicons name="timer-outline" size={RFPercentage(12)} color="white" />
                      <Text style={{ color: '#fff', fontSize: RFPercentage(3) }}>
                        Start Shift
                      </Text>
                    </TouchableOpacity>
                    :
                    <TouchableOpacity onPress={TimeOut} style={{width: width, alignItems: 'center'}}>
                      <MaterialCommunityIcons name="clock-time-one" size={RFPercentage(12)} color="white" />
                      <Text style={{ color: '#fff', fontSize: RFPercentage(3) }}>
                        Shift End
                      </Text>
                    </TouchableOpacity>
                  }
                </View>
              }
            </ScrollView>
          </>
        )
      }
      {
        SelectingLocation?
        <>
          <ScrollView style={{ padding: 20, backgroundColor: 'rgba(255, 255, 255, 0.9)', zIndex: 2, maxHeight: '50%', position: 'absolute', top: '20%', borderRadius: 5, left: '7.5%', width: '85%' }} showsVerticalScrollIndicator={false}>
            <Text style={{ fontSize: 15, marginBottom: 10, fontWeight: 'bold' }}>Select Location</Text>
            <TouchableOpacity key={ 99999 } onPress={ () => setLocationID({index: 99999, location_code: 99999, location_name: "Other", latitude: undefined, longitude: undefined, location_address: "Unknown Location"}) } style={{ width: '100%', padding: 10 }}>
              <Text style={{ color: LocationID.index === 99999 ? '#898989' : '#000', fontSize: 15 }}>
                Other Location
              </Text>
            </TouchableOpacity>
            {
              Locations.length === 0 ? <Text style={{ textAlign: 'center' }}>Loading Locations...</Text> :
              Locations.map(
                ( val, index ) => {
                  return (
                    <TouchableOpacity key={ index } onPress={ () => setLocationID({index: index, location_code: val.location_code, location_name: val.location_name, latitude: val.latitude, longitude: val.longitude, location_address: val.address}) } style={{ width: '100%', padding: 10 }}>
                      <Text style={{ color: LocationID.index === index ? '#57A2D5' : '#000', fontSize: 15 }}>
                        { val.location_name.length > 20 ? (val.location_name.substring(0,25)+'...') : val.location_name }
                      </Text>
                    </TouchableOpacity>
                  )
                }
              )
            }
            <View style={{ height: 50 }}></View>
          </ScrollView>
          <TouchableOpacity onPress={ () => setSelectingLocation(false) } style={{ zIndex: 2, backgroundColor: '#898989', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 5, position: 'absolute', top: 170, right: '13%' }}>
            <Text style={{ color: '#fff', textAlign: 'center', fontSize: 12 }}>Close</Text>
          </TouchableOpacity>
        </>
        :null
      }
      <Animated.Text style={{fontSize: 10, borderRadius: 10, position: 'absolute', top: alertTop, textAlign: 'center', left: '25%', width: '50%', backgroundColor: "rgba(255, 255, 255, .8)", zIndex: 1, padding: 10, opacity: alertOpacity}}>You're out of location! {Math.round(Distance)}km away.</Animated.Text>
    </>
  );

}

export default Operations;