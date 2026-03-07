understand subscription schema how it works 

see in subscription schema we have 2 things channel and subscribers, and both are users
so when we visit profile like profile of channel or user we see how many people subscribed to our channel and how many channel we subscribed so how to calculate this subscribers for that particular channel

if we create array of subscribes and push the id of users who will subscribe to that channel in to that array it will be very expensive opaeration because their can be millions of subscribers then to find particular user from that suscriber will be difficult

so how to do it:

suppose their are users
users -> a, b, c, d, e
and channels
channels -> cac, hcc, fcc

so any time user will suscribe to any channel a document object will get created in mongodb with specific id and other info for exp 

if user a suscribe to channel cac a document will get created in database with info
suscriber -> a
channel -> cac

then if b suscribe to channel cac, again new document will get create with info
suscriber -> b
channel -> cac

similarly for c, new document will get create
suscriber -> c
channel -> cac

now if c also want to suscribe to hcc a new document will get created
suscriber -> c
channel -> hcc

now if c also want to suscribe to fcc a new document will get created
suscriber -> c
channel -> fcc

so this how document get created in db for every suscribe

now suppose we want to calculate how many user suscriber to channel cac so how will we do it we will find the document with this field channel -> cac not with suscriber field in above example we have 3 document with channel -> cac field so their will be 3 suscriber

and when we want to know how many channel that user suscribed in this case lets say haw many channel c suscribed so in this case we will look for this field suscriber -> c 
so in this case we have 3 so we will get 3 

so conclusion:
when we want to count how many user subsribed to that particular channel we look for channel filed 

when we want to count how many channel user subsribed we look for subscriber field 

