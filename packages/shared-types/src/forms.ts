import type {
  Activity,
  ActivityContact,
  ActivityExpense,
  ActivityPayment,
  ActivityRSVP,
  ActivityTask,
  ActivityAttachment,
  Assessment,
  AttendanceRecord,
  Book,
  CoopEvent,
  CoopGroup,
  CoopMember,
  CoopSharingPreferences,
  CurriculumPackage,
  CustomStandard,
  FamilyGoal,
  FieldTrip,
  FieldTripActivity,
  MentorProfile,
  MentorRequest,
  Milestone,
  MilestoneResource,
  RecurringActivity,
  ResourceRating,
  Session,
  SharedResource,
  Sponsor,
  SponsoredResource,
  Student,
  StudentBook,
  SubjectChoreMapping,
  StudentReward,
  UmbrellaSchool,
  UmbrellaSchoolEnrollment,
  UmbrellaSchoolReport
} from './entities'

export type CreateMilestone = Omit<Milestone, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateMilestone = Partial<Omit<CreateMilestone, 'studentId' | 'templateId'>>

export type CreateAssessment = Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateAssessment = Partial<Omit<CreateAssessment, 'studentId'>>

export type CreateChoreMapping = Omit<SubjectChoreMapping, 'id' | 'createdAt'>
export type UpdateChoreMapping = Partial<Omit<CreateChoreMapping, 'subjectId'>>

export type CreateReward = Omit<StudentReward, 'id' | 'createdAt'>

export type CreateFamilyGoal = Omit<FamilyGoal, 'id' | 'createdAt' | 'achievedAt'>
export type UpdateFamilyGoal = Partial<Omit<CreateFamilyGoal, never>>

export type CreateRecurringActivity = Omit<RecurringActivity, 'id' | 'createdAt' | 'updatedAt' | 'lastLoggedDate'>
export type UpdateRecurringActivity = Partial<Omit<CreateRecurringActivity, 'studentId'>>

export type CreateAttachment = Omit<ActivityAttachment, 'id' | 'createdAt' | 'thumbnailPath'>

export type CreateResource = Omit<MilestoneResource, 'id' | 'createdAt'>

export type CreateBook = Omit<Book, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateBook = Partial<CreateBook>
export type CreateStudentBook = Omit<StudentBook, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateStudentBook = Partial<Omit<CreateStudentBook, 'studentId' | 'bookId'>>

export type CreateFieldTrip = Omit<FieldTrip, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateFieldTrip = Partial<CreateFieldTrip>

export type CreateFieldTripActivity = Omit<FieldTripActivity, 'id' | 'createdAt'>

export type CreateCoopGroup = Omit<CoopGroup, 'id' | 'inviteCode' | 'createdAt' | 'updatedAt'>
export type UpdateCoopGroup = Partial<Omit<CreateCoopGroup, 'createdBy'>>

export type CreateCoopMember = Omit<CoopMember, 'id' | 'joinedAt'>
export type UpdateCoopMember = Partial<Omit<CreateCoopMember, 'groupId'>>

export type CreateCoopEvent = Omit<CoopEvent, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateCoopEvent = Partial<Omit<CreateCoopEvent, 'groupId'>>

export type UpdateCoopSharingPreferences = Partial<Omit<CoopSharingPreferences, 'id' | 'groupId' | 'updatedAt'>>

export type CreateSharedResource = Omit<SharedResource, 'id' | 'averageRating' | 'ratingCount' | 'createdAt' | 'updatedAt'>
export type UpdateSharedResource = Partial<Omit<CreateSharedResource, 'groupId' | 'sharedBy'>>

export type CreateResourceRating = Omit<ResourceRating, 'id' | 'createdAt'>

export type CreateMentorProfile = Omit<MentorProfile, 'id' | 'currentMenteeCount' | 'createdAt' | 'updatedAt'>
export type UpdateMentorProfile = Partial<Omit<CreateMentorProfile, 'memberId'>>

export type CreateMentorRequest = Omit<MentorRequest, 'id' | 'status' | 'responseMessage' | 'createdAt' | 'updatedAt'>

export type CreateActivityTask = Omit<ActivityTask, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateActivityTask = Partial<Omit<CreateActivityTask, 'activityId'>>

export type CreateActivityContact = Omit<ActivityContact, 'id' | 'createdAt'>
export type UpdateActivityContact = Partial<Omit<CreateActivityContact, 'activityId'>>

export type CreateActivityRSVP = Omit<ActivityRSVP, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateActivityRSVP = Partial<Omit<CreateActivityRSVP, 'activityId'>>

export type CreateActivityExpense = Omit<ActivityExpense, 'id' | 'createdAt'>
export type UpdateActivityExpense = Partial<Omit<CreateActivityExpense, 'activityId'>>

export type CreateActivityPayment = Omit<ActivityPayment, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateActivityPayment = Partial<Omit<CreateActivityPayment, 'activityId'>>

export type CreateAttendanceRecord = Omit<AttendanceRecord, 'id' | 'createdAt'>
export type UpdateAttendanceRecord = Partial<Omit<CreateAttendanceRecord, 'studentId' | 'date'>>

export type CreateCustomStandard = Omit<CustomStandard, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateCustomStandard = Partial<Omit<CreateCustomStandard, 'gradeLevel' | 'subjectId'>>

export type CreateCurriculumPackage = Omit<CurriculumPackage, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateCurriculumPackage = Partial<Omit<CreateCurriculumPackage, 'id'>>

// Form types for creating/updating entities
export type CreateStudent = Omit<Student, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateStudent = Partial<CreateStudent>

export type CreateSession = Omit<Session, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateSession = Partial<CreateSession>

export type CreateActivity = Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateActivity = Partial<CreateActivity>

export type CreateSponsor = Omit<Sponsor, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateSponsor = Partial<Omit<CreateSponsor, 'tier'>>

export type CreateSponsoredResource = Omit<SponsoredResource, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateSponsoredResource = Partial<Omit<CreateSponsoredResource, 'sponsorId'>>

export type CreateUmbrellaSchool = Omit<UmbrellaSchool, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateUmbrellaSchool = Partial<Omit<CreateUmbrellaSchool, 'state'>>

export type CreateUmbrellaSchoolEnrollment = Omit<UmbrellaSchoolEnrollment, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateUmbrellaSchoolEnrollment = Partial<Omit<CreateUmbrellaSchoolEnrollment, 'umbrellaSchoolId' | 'studentId'>>

export type CreateUmbrellaSchoolReport = Omit<UmbrellaSchoolReport, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateUmbrellaSchoolReport = Partial<Omit<CreateUmbrellaSchoolReport, 'umbrellaSchoolId' | 'studentId'>>
